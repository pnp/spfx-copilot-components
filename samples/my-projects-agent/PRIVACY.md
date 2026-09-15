# Privacy information

My Planner Projects Agent is a community sample that runs in the user's Microsoft 365 tenant. It uses delegated Microsoft Graph access to read the signed-in user's accessible Planner plans, tasks, and Microsoft 365 groups. If the user confirms creation by pressing **Create**, it creates the requested plan, buckets, and tasks in Planner.

The sample does not include a remote application service and does not intentionally transmit Planner or group data outside Microsoft 365. Access tokens are obtained through the SharePoint Framework token provider and are not persisted by the component. Tenant administrators control the delegated `Tasks.ReadWrite` and `GroupMember.Read.All` permissions and can revoke them through SharePoint API access management.

Review the source code and tenant policies before deployment. This sample is provided as-is and is not a substitute for your organization's privacy or security review.

For questions, contact [João Mendes](https://github.com/joaojmendes).
