# Data Subject Request Procedures

## Overview

This document outlines the procedures for handling data subject requests under GDPR, CCPA, and other privacy regulations.

## Types of Requests

### GDPR Rights (EU/UK)
1. **Right to Access** - Provide copy of personal data
2. **Right to Rectification** - Correct inaccurate data
3. **Right to Erasure** ("Right to be Forgotten") - Delete personal data
4. **Right to Restriction** - Limit processing of data
5. **Right to Data Portability** - Provide data in machine-readable format
6. **Right to Object** - Object to processing
7. **Rights related to Automated Decision-Making** - Opt-out of automated decisions

### CCPA Rights (California)
1. **Right to Know** - What data is collected and how it's used
2. **Right to Delete** - Request deletion of personal information
3. **Right to Opt-Out** - Opt-out of sale of personal information
4. **Right to Non-Discrimination** - Equal service regardless of privacy choices

## Request Handling Process

### Step 1: Receive Request
- **Email:** privacy@robinsonaisystems.com
- **Web Form:** (to be implemented on website)
- **Mail:** (physical address on privacy policy)

### Step 2: Log Request
Create a record in `docs/compliance/records/data-subject-requests/YYYY-MM-DD-[type]-[ticket-id].md`:

```markdown
# Data Subject Request - [Type]

**Date Received:** YYYY-MM-DD
**Request Type:** [Access/Deletion/Rectification/etc.]
**Requester Email:** [email]
**Requester Name:** [name]
**Status:** Received
**Deadline:** [30 days from receipt for GDPR, 45 days for CCPA]

## Request Details
[Copy of original request]

## Verification Steps
- [ ] Email verification sent
- [ ] Identity confirmed
- [ ] Account ownership verified

## Actions Taken
[Document all actions]

## Response Sent
**Date:** YYYY-MM-DD
**Method:** Email
**Content:** [Summary of response]
```

### Step 3: Verify Identity
- Send verification email to requester
- For high-risk requests (deletion), require additional verification:
  - Account login
  - Security questions
  - Government ID (if necessary)

### Step 4: Process Request

#### For Access Requests:
1. Query all systems for user data:
   - Production database (Neon)
   - Analytics (if applicable)
   - Logs (if containing PII)
   - Backups (note: may not be immediately accessible)
2. Compile data into structured format (JSON or CSV)
3. Redact any third-party personal data
4. Provide via secure download link (expires in 7 days)

#### For Deletion Requests:
1. Verify no legal obligation to retain data
2. Delete from all systems:
   - Production database
   - Analytics
   - Logs (where feasible)
   - Backups (mark for deletion on next backup cycle)
3. Document deletion in request record
4. Send confirmation to requester

#### For Rectification Requests:
1. Verify accuracy of correction
2. Update data in all systems
3. Notify any third parties who received the data (if applicable)
4. Send confirmation to requester

#### For Portability Requests:
1. Export data in machine-readable format (JSON, CSV)
2. Include all data categories
3. Provide via secure download link
4. Include data schema/documentation

### Step 5: Respond to Requester
- **Timeline:** Within 30 days (GDPR) or 45 days (CCPA)
- **Extension:** Can extend by 30/45 days if complex, must notify requester
- **Method:** Email to verified address
- **Content:**
  - Confirmation of action taken
  - Data provided (if access/portability request)
  - Explanation if request denied
  - Right to complain to supervisory authority (GDPR)

### Step 6: Document & Close
- Update request record with final status
- Archive request documentation
- Update compliance metrics

## Response Templates

### Access Request Response
```
Subject: Your Data Access Request - Robinson AI Systems

Dear [Name],

Thank you for your data access request received on [Date].

We have compiled all personal data we hold about you. You can download 
your data using the secure link below (expires in 7 days):

[Secure Download Link]

The data includes:
- Account information
- Usage data
- [Other categories]

If you have any questions about this data, please contact us at 
privacy@robinsonaisystems.com.

Best regards,
Robinson AI Systems Privacy Team
```

### Deletion Request Response
```
Subject: Your Data Deletion Request - Robinson AI Systems

Dear [Name],

Thank you for your data deletion request received on [Date].

We have successfully deleted all personal data associated with your 
account from our systems. This includes:
- Account information
- Usage data
- [Other categories]

Please note that some data may remain in backups for up to [X] days 
before being permanently deleted.

If you have any questions, please contact us at 
privacy@robinsonaisystems.com.

Best regards,
Robinson AI Systems Privacy Team
```

## Exceptions & Limitations

### When We Can Refuse a Request:
1. **Legal Obligation:** Required to retain data by law
2. **Legitimate Interests:** Necessary for legal claims
3. **Public Interest:** Required for public health, scientific research
4. **Contract Performance:** Necessary to fulfill contract
5. **Manifestly Unfounded:** Clearly frivolous or excessive

### When We Can Charge a Fee:
- Request is manifestly unfounded or excessive
- Multiple copies requested (beyond first free copy)
- Fee must be reasonable and based on administrative costs

## Data Retention After Deletion

| Data Type | Retention After Deletion | Reason |
|-----------|-------------------------|--------|
| Transaction Records | 7 years | Tax/accounting requirements |
| Legal Claims Data | Until claim resolved | Legal defense |
| Backup Data | 30-90 days | Technical limitation |
| Anonymized Analytics | Indefinitely | No longer personal data |

## Escalation

If unable to fulfill request within deadline:
1. Notify requester of extension (must be within original deadline)
2. Explain reason for extension
3. Escalate to legal@robinsonaisystems.com if legal questions arise
4. Consider consulting external privacy counsel for complex cases

## Metrics & Reporting

Track monthly:
- Number of requests received (by type)
- Average response time
- Requests fulfilled vs. denied
- Reasons for denial
- Extensions granted

Report quarterly to management.

## Training

All team members with access to customer data must complete:
- Annual privacy training
- Data subject request handling procedures
- Data security best practices

## Related Documents

- [Privacy Policy](../policies/privacy-policy.md)
- [Data Processing Agreement](../policies/data-processing-agreement.md)
- [Security Policy](../policies/security-policy.md)

---

**Last Updated:** 2025-01-06  
**Version:** 1.0  
**Owner:** privacy@robinsonaisystems.com

