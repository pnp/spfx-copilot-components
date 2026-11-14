# CosmoPolite: privacy

CosmoPolite is a Copilot UX component and agent for Microsoft 365 Copilot, published by Stefan Bauer · N8D.

## What CosmoPolite does not do

- It runs **no server of its own**. Nothing you ask or see is sent to N8D or to Stefan Bauer.
- It uses **no analytics, no tracking and no cookies**.

## What happens when a card is shown

- **Your conversation** is handled by Microsoft 365 Copilot in your organisation's tenant, under Microsoft's terms and your organisation's settings. CosmoPolite only receives the story the agent writes (headline, text, language) and a few hints for the photo.
- **Photos:** to find a picture, your browser sends a short search with **English keywords** (for example "Vienna St. Stephen Cathedral") directly to open image collections: Wikipedia and Wikimedia Commons, Openverse, The Metropolitan Museum of Art and NASA. Like any website, these services see your IP address and the keywords. The photo is then loaded from their image servers, and its author and licence are shown on the card. When the story is about a member of the Microsoft 365 & Power Platform community team, the card recognises the name on your device (from a list built into it) and loads that person's portrait from the team page, pnp.github.io.
- **Read aloud** uses your browser's speech engine. In Microsoft Edge, the "Online (Natural)" voices send the text that is read to Microsoft's speech service; other voices run on your device.
- **Your chosen look** (design, layout, light or dark) is stored in your browser's local or session storage, so the next card keeps it. It never leaves your device.

## Contact

Stefan Bauer · N8D, [n8d.at](https://n8d.at), stefan.bauer@n8d.at
