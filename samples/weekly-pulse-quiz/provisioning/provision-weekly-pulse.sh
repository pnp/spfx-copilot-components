#!/usr/bin/env bash
# Weekly Pulse Quiz: one-time, idempotent list setup with CLI for Microsoft 365 (m365).
# Same result as Provision-WeeklyPulse.ps1. Run as a site owner after `m365 login`.
# Safe to run again: it adds what is missing and brings older column and view
# settings up to date. It never changes or deletes list items.
#
#   ./provision-weekly-pulse.sh --site-url https://contoso.sharepoint.com [--responses-site-url URL] [--dry-run]
#
# Options:
#   --site-url URL            Questions + Config site (required)
#   --responses-site-url URL  Responses site (default: --site-url)
#   --tenant-id GUID          Skip the tenant id lookup
#   --questions-list TITLE    default "Weekly Pulse Questions"
#   --responses-list TITLE    default "Weekly Pulse Responses"
#   --config-list TITLE       default "Weekly Pulse Config" (keep it: Copilot reads this title)
#   --anonymity MODE          Anonymous (default) or Named, for a new settings row
#   --quiz-time-zone ZONE     IANA zone the quiz week rolls over in (default UTC; keep it equal to QUIZ_TIME_ZONE)
#   --dry-run                 Print the write commands instead of running them (reads still run)
set -euo pipefail

SITE_URL=""; RESP_URL=""; TENANT_ID=""; DRY=0; RESP_URL_SET=0
Q_LIST="Weekly Pulse Questions"; R_LIST="Weekly Pulse Responses"; C_LIST="Weekly Pulse Config"; ANON="Anonymous"; QUIZ_TZ="UTC"

usage() { sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }
while [[ $# -gt 0 ]]; do
  case "$1" in
    --site-url) SITE_URL="${2%/}"; shift 2 ;;
    --responses-site-url) RESP_URL="${2%/}"; RESP_URL_SET=1; shift 2 ;;
    --tenant-id) TENANT_ID="$2"; shift 2 ;;
    --questions-list) Q_LIST="$2"; shift 2 ;;
    --responses-list) R_LIST="$2"; shift 2 ;;
    --config-list) C_LIST="$2"; shift 2 ;;
    --anonymity) ANON="$2"; shift 2 ;;
    --quiz-time-zone) QUIZ_TZ="$2"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) usage 0 ;;
    *) echo "Unknown option: $1" >&2; usage 1 ;;
  esac
done

url_re='^https://[^/]+\.sharepoint\.(com|us|de|cn)(/.*)?$'
[[ -n "$SITE_URL" ]] || { echo "--site-url is required" >&2; usage 1; }
[[ "$SITE_URL" =~ $url_re ]] || { echo "--site-url must be an https SharePoint URL" >&2; exit 1; }
[[ -n "$RESP_URL" ]] || RESP_URL="$SITE_URL"
[[ "$RESP_URL" =~ $url_re ]] || { echo "--responses-site-url must be an https SharePoint URL" >&2; exit 1; }
[[ "$ANON" == "Anonymous" || "$ANON" == "Named" ]] || { echo "--anonymity must be Anonymous or Named" >&2; exit 1; }
command -v m365 >/dev/null || { echo "CLI for Microsoft 365 not found: npm i -g @pnp/cli-microsoft365" >&2; exit 1; }
m365 status -o text >/dev/null 2>&1 || { echo "Not signed in. Run: m365 login" >&2; exit 1; }

step() { echo "  - $*"; }
# Writes go through run(); --dry-run prints them instead.
run() {
  if [[ $DRY -eq 1 ]]; then printf '  [dry run] m365'; printf ' %q' "$@"; echo; else m365 "$@" -o none; fi
}
list_exists() { m365 spo list get --webUrl "$1" --title "$2" -o none >/dev/null 2>&1; }
field_exists() { m365 spo field get --webUrl "$1" --listTitle "$2" --internalName "$3" -o none >/dev/null 2>&1; }

ensure_list() { # web title description
  if list_exists "$1" "$2"; then step "List '$2' exists"; return; fi
  run spo list add --webUrl "$1" --title "$2" --baseTemplate GenericList --description "$3"
  [[ $DRY -eq 1 ]] || step "Created list '$2'"
}

ensure_field() { # web list internalName xml indexed(0/1)
  local web="$1" list="$2" name="$3" xml="$4" indexed="$5"
  if [[ $DRY -eq 1 ]] && ! list_exists "$web" "$list"; then step "[dry run] would add column $name"; return; fi
  if field_exists "$web" "$list" "$name"; then
    step "Column $name exists"
  else
    run spo field add --webUrl "$web" --listTitle "$list" --xml "$xml"
    step "Added column $name"
  fi
  if [[ "$indexed" == 1 ]]; then
    local idx="false"
    field_exists "$web" "$list" "$name" && idx=$(m365 spo field get --webUrl "$web" --listTitle "$list" --internalName "$name" --query Indexed -o text 2>/dev/null || echo false)
    if [[ "$idx" != "true" ]]; then run spo field set --webUrl "$web" --listTitle "$list" --internalName "$name" --Indexed true; step "Indexed $name"; fi
  fi
}

text_xml()   { echo "<Field Type='Text' Name='$1' StaticName='$1' DisplayName='$1' Required='${2:-FALSE}' MaxLength='${3:-255}' />"; }
# Whole number, no thousands separator (2026, not 2,026). Optional 4th arg: calculated default (DefaultFormula).
num_xml() {
  local open="<Field Type='Number' Name='$1' StaticName='$1' DisplayName='$1' Required='TRUE' Min='$2' Max='$3' Decimals='0' Commas='FALSE'"
  if [[ -n "${4:-}" ]]; then echo "$open><DefaultFormula>$4</DefaultFormula></Field>"; else echo "$open />"; fi
}

# ---- bring existing columns up to date (schema and display name only; items are never touched)
set_attr() { # xml name value -> xml with name="value" on the <Field> element
  local xml="$1" name="$2" value="$3" head rest re
  head="${xml%%>*}"; rest="${xml#*>}"
  re=" $name=[\"']([^\"']*)[\"']"
  if [[ "$head" =~ $re ]]; then
    [[ "${BASH_REMATCH[1]}" == "$value" ]] && { echo "$xml"; return; }
    head="${head/"${BASH_REMATCH[0]}"/ $name=\"$value\"}"
  else
    head="<Field $name=\"$value\" ${head#<Field }"
  fi
  echo "$head>$rest"
}
set_default_formula() { # xml formula
  local xml="$1" formula="$2" head rest re='<DefaultFormula>([^<]*)</DefaultFormula>'
  if [[ "$xml" =~ $re ]]; then
    [[ "${BASH_REMATCH[1]}" == "$formula" ]] && { echo "$xml"; return; }
    echo "${xml/"${BASH_REMATCH[0]}"/<DefaultFormula>$formula</DefaultFormula>}"; return
  fi
  head="${xml%%>*}"; rest="${xml#*>}"
  if [[ "$head" == */ ]]; then
    head="${head%/}"; head="${head% }"
    echo "$head><DefaultFormula>$formula</DefaultFormula></Field>$rest"
  else
    echo "$head><DefaultFormula>$formula</DefaultFormula>$rest"
  fi
}
upgrade_number_field() { # web list internalName [defaultFormula]
  local web="$1" list="$2" name="$3" formula="${4:-}" xml new
  field_exists "$web" "$list" "$name" || return 0
  xml=$(m365 spo field get --webUrl "$web" --listTitle "$list" --internalName "$name" --query SchemaXml -o text)
  new=$(set_attr "$xml" Commas FALSE); new=$(set_attr "$new" Decimals 0)
  [[ -n "$formula" ]] && new=$(set_default_formula "$new" "$formula")
  if [[ "$new" != "$xml" ]]; then
    run spo field set --webUrl "$web" --listTitle "$list" --internalName "$name" --SchemaXml "$new"
    step "Updated column $name (no thousands separator${formula:+, default $formula})"
    COLUMNS_UPDATED=$((COLUMNS_UPDATED + 1))
  fi
}
upgrade_field_title() { # web list internalName title
  local current
  field_exists "$1" "$2" "$3" || return 0
  current=$(m365 spo field get --webUrl "$1" --listTitle "$2" --internalName "$3" --query Title -o text)
  if [[ "$current" != "$4" ]]; then
    run spo field set --webUrl "$1" --listTitle "$2" --internalName "$3" --Title "$4"
    step "Renamed column $3: '$current' -> '$4' (internal name unchanged)"
    COLUMNS_UPDATED=$((COLUMNS_UPDATED + 1))
  fi
}

# ---- views: QuizYear and WeekNumber right after Title
Q_VIEW_FIELDS=(LinkTitle QuizYear WeekNumber ChoiceA ChoiceB ChoiceC ChoiceD CorrectChoice Justification IsActive WeekLabel)
view_fields() { # web listId viewId -> internal names, one per line
  m365 request --url "$1/_api/web/lists(guid'$2')/views(guid'$3')/viewfields" --accept 'application/json;odata=nometadata' -o json \
    | tr -d '\n' | sed -E 's/.*"Items"[^[]*\[([^]]*)\].*/\1/' | tr ',' '\n' | tr -d '" ' | sed '/^$/d'
}
# Adds the missing question columns (keeps any others) and moves QuizYear, WeekNumber after Title.
# With a 5th arg "all", puts every question column in Q_VIEW_FIELDS order (used for "Upcoming weeks").
# Prints 1 if it changed (or would change) the view.
ensure_question_view_fields() { # web listId viewId viewTitle [all]
  local web="$1" lid="$2" vid="$3" vtitle="$4" changed=0 f i at
  local -a cur=() order=(QuizYear WeekNumber)
  [[ "${5:-}" == all ]] && order=("${Q_VIEW_FIELDS[@]:1}")
  mapfile -t cur < <(view_fields "$web" "$lid" "$vid")
  for f in "${Q_VIEW_FIELDS[@]}"; do
    if ! printf '%s\n' "${cur[@]}" | grep -qx "$f"; then
      run spo list view field add --webUrl "$web" --listId "$lid" --viewId "$vid" --title "$f" >&2
      cur+=("$f"); changed=1
    fi
  done
  at=0
  for i in "${!cur[@]}"; do [[ "${cur[$i]}" == LinkTitle ]] && at=$((i + 1)); done
  for f in "${order[@]}"; do
    local pos=-1
    for i in "${!cur[@]}"; do [[ "${cur[$i]}" == "$f" ]] && pos=$i; done
    if [[ $pos -ne $at ]]; then
      run spo list view field set --webUrl "$web" --listId "$lid" --viewId "$vid" --title "$f" --position "$at" >&2
      local -a next=()
      for i in "${!cur[@]}"; do [[ $i -ne $pos ]] && next+=("${cur[$i]}"); done
      cur=("${next[@]:0:$at}" "$f" "${next[@]:$at}")
      changed=1
    fi
    at=$((at + 1))
  done
  [[ $changed -eq 1 ]] && step "View '$vtitle': $(IFS=,; echo "${cur[*]}")" >&2
  echo "$changed"
}
yesno_xml()  { local d=""; [[ -n "${2:-}" ]] && d="<Default>$2</Default>"; echo "<Field Type='Boolean' Name='$1' StaticName='$1' DisplayName='$1'>$d</Field>"; }
choice_xml() { # name default choices...
  local name="$1" def="$2" c=""; shift 2
  for x in "$@"; do c+="<CHOICE>$x</CHOICE>"; done
  [[ -n "$def" ]] && def="<Default>$def</Default>"
  echo "<Field Type='Choice' Name='$name' StaticName='$name' DisplayName='$name' Format='Dropdown' FillInChoice='FALSE'>$def<CHOICES>$c</CHOICES></Field>"
}

# ------------------------------------------------------------ Questions + Config (site URL)
echo; echo "Questions/Config site: $SITE_URL"
TZ_DESC=$(m365 request --url "$SITE_URL/_api/web/RegionalSettings/TimeZone" --query Description -o text 2>/dev/null || true)
# Best effort: "UTC" matches "Coordinated Universal Time"; "Europe/Paris" matches a description that lists Paris.
case "$QUIZ_TZ" in UTC|GMT|Etc/UTC|Etc/GMT) TZ_HINT="Coordinated Universal Time" ;; *) TZ_HINT="${QUIZ_TZ##*/}"; TZ_HINT="${TZ_HINT//_/ }" ;; esac
if [[ -n "$TZ_DESC" && "$TZ_DESC" != *"$TZ_HINT"* ]]; then
  echo "WARNING: site time zone is '$TZ_DESC'. The quiz week changes on Monday 00:00 $QUIZ_TZ, but the 'Upcoming weeks' view uses the site's [Today]." >&2
fi

echo; echo "$Q_LIST"
ensure_list "$SITE_URL" "$Q_LIST" "Weekly Pulse questions. One active item per ISO week."
COLUMNS_UPDATED=0
ensure_field "$SITE_URL" "$Q_LIST" QuizYear "$(num_xml QuizYear 2020 2100 '=YEAR(Today)')" 1
ensure_field "$SITE_URL" "$Q_LIST" WeekNumber "$(num_xml WeekNumber 1 53)" 1
ensure_field "$SITE_URL" "$Q_LIST" ChoiceA "$(text_xml ChoiceA TRUE)" 0
ensure_field "$SITE_URL" "$Q_LIST" ChoiceB "$(text_xml ChoiceB TRUE)" 0
ensure_field "$SITE_URL" "$Q_LIST" ChoiceC "$(text_xml ChoiceC)" 0
ensure_field "$SITE_URL" "$Q_LIST" ChoiceD "$(text_xml ChoiceD)" 0
ensure_field "$SITE_URL" "$Q_LIST" CorrectChoice "$(choice_xml CorrectChoice '' A B C D)" 0
ensure_field "$SITE_URL" "$Q_LIST" Justification "<Field Type='Note' Name='Justification' StaticName='Justification' DisplayName='Justification' NumLines='6' RichText='FALSE' Description='Why the right answer is right. Up to 500 characters; longer text is cut.' />" 0
ensure_field "$SITE_URL" "$Q_LIST" IsActive "$(yesno_xml IsActive 1)" 1
ensure_field "$SITE_URL" "$Q_LIST" WeekStart "<Field Type='Calculated' Name='WeekStart' StaticName='WeekStart' DisplayName='Week starts' ResultType='DateTime' Format='DateOnly' ReadOnly='TRUE'><Formula>=DATE(QuizYear,1,4)-MOD(WEEKDAY(DATE(QuizYear,1,4))+5,7)+(WeekNumber-1)*7</Formula><FieldRefs><FieldRef Name='QuizYear' /><FieldRef Name='WeekNumber' /></FieldRefs></Field>" 0
ensure_field "$SITE_URL" "$Q_LIST" WeekLabel "<Field Type='Calculated' Name='WeekLabel' StaticName='WeekLabel' DisplayName='Week label' ResultType='Text' ReadOnly='TRUE'><Formula>=QuizYear&amp;\"-W\"&amp;TEXT(WeekNumber,\"00\")</Formula><FieldRefs><FieldRef Name='QuizYear' /><FieldRef Name='WeekNumber' /></FieldRefs></Field>" 0
# Lists from an earlier setup: bring these columns up to date (new lists already match, so nothing happens).
if list_exists "$SITE_URL" "$Q_LIST"; then
  upgrade_number_field "$SITE_URL" "$Q_LIST" QuizYear '=YEAR(Today)'
  upgrade_number_field "$SITE_URL" "$Q_LIST" WeekNumber
  upgrade_field_title "$SITE_URL" "$Q_LIST" WeekLabel 'Week label'
  [[ $COLUMNS_UPDATED -gt 0 ]] && step "Updated $COLUMNS_UPDATED column(s)"
fi

UPCOMING_QUERY="<Where><Geq><FieldRef Name='WeekStart' /><Value Type='DateTime'><Today OffsetDays='-6' /></Value></Geq></Where><OrderBy><FieldRef Name='QuizYear' Ascending='TRUE' /><FieldRef Name='WeekNumber' Ascending='TRUE' /></OrderBy>"
if list_exists "$SITE_URL" "$Q_LIST"; then
  VIEWS_CREATED=0; VIEWS_UPDATED=0
  Q_LIST_ID=$(m365 spo list get --webUrl "$SITE_URL" --title "$Q_LIST" --properties Id --query Id -o text)
  # Default view (usually "All Items"): add the question columns, QuizYear and WeekNumber after Title. Nothing is removed.
  DEFAULT_VIEW_ID=$(m365 spo list view list --webUrl "$SITE_URL" --listId "$Q_LIST_ID" --query "[?DefaultView && Title != 'Upcoming weeks'].Id | [0]" -o text 2>/dev/null || true)
  if [[ -n "$DEFAULT_VIEW_ID" && "$DEFAULT_VIEW_ID" != "null" ]]; then
    DEFAULT_VIEW_TITLE=$(m365 spo list view get --webUrl "$SITE_URL" --listId "$Q_LIST_ID" --id "$DEFAULT_VIEW_ID" --query Title -o text)
    [[ $(ensure_question_view_fields "$SITE_URL" "$Q_LIST_ID" "$DEFAULT_VIEW_ID" "$DEFAULT_VIEW_TITLE") == 1 ]] && VIEWS_UPDATED=$((VIEWS_UPDATED + 1))
  fi
  # "Upcoming weeks": create it, or re-set its query and columns.
  UPCOMING_ID=$(m365 spo list view get --webUrl "$SITE_URL" --listId "$Q_LIST_ID" --title "Upcoming weeks" --query Id -o text 2>/dev/null || true)
  if [[ -n "$UPCOMING_ID" && "$UPCOMING_ID" != "null" ]]; then
    run spo list view set --webUrl "$SITE_URL" --listId "$Q_LIST_ID" --id "$UPCOMING_ID" --ViewQuery "$UPCOMING_QUERY"
    ensure_question_view_fields "$SITE_URL" "$Q_LIST_ID" "$UPCOMING_ID" "Upcoming weeks" all >/dev/null
    VIEWS_UPDATED=$((VIEWS_UPDATED + 1))
  else
    run spo list view add --webUrl "$SITE_URL" --listTitle "$Q_LIST" --title "Upcoming weeks" \
      --fields "$(IFS=,; echo "${Q_VIEW_FIELDS[*]}")" \
      --viewQuery "$UPCOMING_QUERY" --paged true --rowLimit 100
    VIEWS_CREATED=1
  fi
  SUMMARY=""
  [[ $VIEWS_CREATED -gt 0 ]] && SUMMARY="Created $VIEWS_CREATED view"
  if [[ $VIEWS_UPDATED -gt 0 ]]; then
    [[ -n "$SUMMARY" ]] && SUMMARY="$SUMMARY, updated" || SUMMARY="Updated"
    SUMMARY="$SUMMARY $VIEWS_UPDATED view$([[ $VIEWS_UPDATED -gt 1 ]] && echo s)"
  fi
  step "$SUMMARY"
else
  step "[dry run] would create view 'Upcoming weeks' and add QuizYear, WeekNumber to the default view"
fi

echo; echo "$C_LIST"
ensure_list "$SITE_URL" "$C_LIST" "Weekly Pulse settings for the Copilot component. Keep exactly one item."
ensure_field "$SITE_URL" "$C_LIST" AnonymityMode "$(choice_xml AnonymityMode Anonymous Anonymous Named)" 0
for f in ShowCorrectAnswer ShowJustification Animations; do ensure_field "$SITE_URL" "$C_LIST" "$f" "$(yesno_xml "$f" 1)" 0; done
for f in ResponsesSiteUrl ResponsesListTitle QuestionsListTitle IntroText NoQuizText; do ensure_field "$SITE_URL" "$C_LIST" "$f" "$(text_xml "$f")" 0; done
ensure_field "$SITE_URL" "$C_LIST" BannerTitle "$(text_xml BannerTitle FALSE 80)" 0
if list_exists "$SITE_URL" "$C_LIST"; then
  FIRST_ID=$(m365 spo listitem list --webUrl "$SITE_URL" --listTitle "$C_LIST" --fields "Id" --query "sort_by(@, &Id)[0].Id" -o text 2>/dev/null || true)
  if [[ -z "$FIRST_ID" || "$FIRST_ID" == "null" ]]; then
    run spo listitem add --webUrl "$SITE_URL" --listTitle "$C_LIST" --Title Settings --AnonymityMode "$ANON" \
      --ShowCorrectAnswer true --ShowJustification true --Animations true \
      --ResponsesSiteUrl "$RESP_URL" --ResponsesListTitle "$R_LIST" --QuestionsListTitle "$Q_LIST"
    step "Added the settings row"
  elif [[ $RESP_URL_SET -eq 1 ]]; then
    run spo listitem set --webUrl "$SITE_URL" --listTitle "$C_LIST" --id "$FIRST_ID" --ResponsesSiteUrl "$RESP_URL"
    step "Set ResponsesSiteUrl on the settings row"
  else
    step "Settings row exists (left as is)"
  fi
else
  step "[dry run] would add the settings row"
fi

# ------------------------------------------------------------ Responses (responses site URL)
echo; echo "$R_LIST on $RESP_URL"
[[ -n "$TENANT_ID" ]] || TENANT_ID=$(m365 tenant id get -o text)
EVERYONE="c:0-.f|rolemanager|spo-grid-all-users/$TENANT_ID"

ensure_list "$RESP_URL" "$R_LIST" "Weekly Pulse answers. People see and edit only their own items."
ensure_field "$RESP_URL" "$R_LIST" QuestionId "<Field Type='Number' Name='QuestionId' StaticName='QuestionId' DisplayName='QuestionId' Required='TRUE' Decimals='0' Min='1' />" 1
ensure_field "$RESP_URL" "$R_LIST" WeekKey "$(text_xml WeekKey FALSE 10)" 1
ensure_field "$RESP_URL" "$R_LIST" Choice "$(choice_xml Choice '' A B C D)" 0
ensure_field "$RESP_URL" "$R_LIST" IsCorrect "$(yesno_xml IsCorrect)" 0
ensure_field "$RESP_URL" "$R_LIST" Source "$(choice_xml Source '' WebPart Copilot)" 0
ensure_field "$RESP_URL" "$R_LIST" Respondent "<Field Type='User' Name='Respondent' StaticName='Respondent' DisplayName='Respondent' UserSelectionMode='PeopleOnly' Description='Written only in Named mode.' />" 0

if list_exists "$RESP_URL" "$R_LIST"; then
  ensure_field "$RESP_URL" "$R_LIST" Author "" 1   # "already answered?" filters on Created By
  # 2 = read own items, 2 = create and edit own items.
  run spo list set --webUrl "$RESP_URL" --title "$R_LIST" --readSecurity 2 --writeSecurity 2 \
    --enableVersioning false --enableAttachments false --noCrawl true
  step "Item-level security: read own, edit own; versioning and attachments off; excluded from search"

  UNIQUE=$(m365 spo list get --webUrl "$RESP_URL" --title "$R_LIST" --properties HasUniqueRoleAssignments --query HasUniqueRoleAssignments -o text)
  if [[ "$UNIQUE" != "true" ]]; then
    # --clearExistingPermissions: members' Edit level includes Manage Lists, which would bypass item-level security.
    run spo list roleinheritance break --webUrl "$RESP_URL" --listTitle "$R_LIST" --clearExistingPermissions --force
    step "Unique permissions (not copied)"
  else
    step "Unique permissions already set"
  fi
  OWNERS=$(m365 spo group get --webUrl "$RESP_URL" --associatedGroup Owner --query Title -o text)
  run spo list roleassignment add --webUrl "$RESP_URL" --listTitle "$R_LIST" --groupName "$OWNERS" --roleDefinitionName "Full Control"
  step "Site owners ('$OWNERS'): Full Control"
  if [[ $DRY -eq 1 ]]; then
    run spo user ensure --webUrl "$RESP_URL" --loginName "$EVERYONE"
    run spo list roleassignment add --webUrl "$RESP_URL" --listTitle "$R_LIST" --principalId "<id from user ensure>" --roleDefinitionName Contribute
  else
    EVERYONE_ID=$(m365 spo user ensure --webUrl "$RESP_URL" --loginName "$EVERYONE" --query Id -o text)
    run spo list roleassignment add --webUrl "$RESP_URL" --listTitle "$R_LIST" --principalId "$EVERYONE_ID" --roleDefinitionName Contribute
  fi
  step "Everyone except external users: Contribute"
  for f in WeekKey QuestionId Choice IsCorrect Source; do
    if [[ $DRY -eq 1 ]]; then run spo list view field add --webUrl "$RESP_URL" --listTitle "$R_LIST" --viewTitle "All Items" --title "$f"
    else run spo list view field add --webUrl "$RESP_URL" --listTitle "$R_LIST" --viewTitle "All Items" --title "$f" >/dev/null 2>&1 || true; fi
  done
  step "Default view: answer columns only (no Created By / Modified By)"
else
  step "[dry run] would index Author, set item-level security, break inheritance and grant permissions"
fi

echo
if [[ $DRY -eq 1 ]]; then echo "Dry run finished. Nothing was changed."; else echo "Done. In '$Q_LIST', set QuizYear and WeekNumber (the ISO week) on each question."; fi
