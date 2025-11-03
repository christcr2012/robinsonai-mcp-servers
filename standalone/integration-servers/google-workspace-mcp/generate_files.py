import os

files = {
    "src/auth.ts": '''import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";

export class GoogleWorkspaceAuth {
  private oauth2Client: OAuth2Client;
  private credentialsPath: string;
  private tokenPath: string;

  constructor(credentialsPath?: string, tokenPath?: string) {
    this.credentialsPath = credentialsPath || process.env.GOOGLE_CREDENTIALS_PATH || "credentials.json";
    this.tokenPath = tokenPath || process.env.GOOGLE_TOKEN_PATH || "token.json";

    const credentials = this.loadCredentials();
    const { client_id, client_secret, redirect_uris } = credentials.installed;

    this.oauth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
    this.loadToken();
  }

  private loadCredentials(): any {
    if (!fs.existsSync(this.credentialsPath)) {
      throw new Error("Credentials file not found: " + this.credentialsPath);
    }
    const content = fs.readFileSync(this.credentialsPath, "utf-8");
    return JSON.parse(content);
  }

  private loadToken(): void {
    if (fs.existsSync(this.tokenPath)) {
      const token = JSON.parse(fs.readFileSync(this.tokenPath, "utf-8"));
      this.oauth2Client.setCredentials(token);
    }
  }

  public getOAuth2Client(): OAuth2Client {
    return this.oauth2Client;
  }

  public async getAccessToken(): Promise<string> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    this.oauth2Client.setCredentials(credentials);
    this.saveToken(credentials);
    return credentials.access_token || "";
  }

  private saveToken(token: any): void {
    fs.writeFileSync(this.tokenPath, JSON.stringify(token, null, 2));
  }
}
''',
    "src/gmail.ts": '''import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { ToolResponse, ToolArguments } from "./types.js";

export class GmailTools {
  private gmail: any;

  constructor(oauth2Client: OAuth2Client) {
    this.gmail = google.gmail({ version: "v1", auth: oauth2Client });
  }

  async sendMessage(args: ToolArguments): Promise<ToolResponse> {
    try {
      const { to, subject, body, cc, bcc } = args;
      const email = [
        "To: " + to,
        cc ? "Cc: " + cc.join(", ") : "",
        bcc ? "Bcc: " + bcc.join(", ") : "",
        "Subject: " + subject,
        "",
        body,
      ]
        .filter(Boolean)
        .join("\\n");

      const encodedMessage = Buffer.from(email).toString("base64").replace(/\\+/g, "-").replace(/\\//g, "_");

      const result = await this.gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encodedMessage },
      });

      return { content: [{ type: "text", text: "Email sent successfully. Message ID: " + result.data.id }] };
    } catch (error: any) {
      return { content: [{ type: "text", text: "Error sending email: " + error.message }] };
    }
  }

  async listMessages(args: ToolArguments): Promise<ToolResponse> {
    try {
      const { maxResults = 10, query } = args;
      const result = await this.gmail.users.messages.list({
        userId: "me",
        maxResults,
        q: query,
      });

      const messages = result.data.messages || [];
      return { content: [{ type: "text", text: JSON.stringify(messages, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: "text", text: "Error listing messages: " + error.message }] };
    }
  }

  async getMessage(args: ToolArguments): Promise<ToolResponse> {
    try {
      const { messageId } = args;
      const result = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      return { content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: "text", text: "Error getting message: " + error.message }] };
    }
  }

  async searchMessages(args: ToolArguments): Promise<ToolResponse> {
    try {
      const { query, maxResults = 10 } = args;
      const result = await this.gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults,
      });

      const messages = result.data.messages || [];
      return { content: [{ type: "text", text: JSON.stringify(messages, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: "text", text: "Error searching messages: " + error.message }] };
    }
  }

  async markAsRead(args: ToolArguments): Promise<ToolResponse> {
    try {
      const { messageIds } = args;
      await this.gmail.users.messages.batchModify({
        userId: "me",
        requestBody: {
          ids: messageIds,
          removeLabelIds: ["UNREAD"],
        },
      });

      return { content: [{ type: "text", text: "Marked " + messageIds.length + " messages as read" }] };
    } catch (error: any) {
      return { content: [{ type: "text", text: "Error marking messages as read: " + error.message }] };
    }
  }
}
''',
}

for filepath, content in files.items():
    with open(filepath, "w") as f:
        f.write(content)
    print(f"Created {filepath}")
