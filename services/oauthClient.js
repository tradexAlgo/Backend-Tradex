// oauthClient.js
import { google } from "googleapis";

const CLIENT_ID =
  "497105170769-jovr105n48s95l213oq6n470el356ml1.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN =
  "1//04eIzv6PqTShGCgYIARAAGAQSNwF-L9Ir0eaxPm7AJaksRGRlnPNdZF7QdJZveHyicF0kEaqhVmQONsbvMOjWychuhXIf2qaPZTw";

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

export default oAuth2Client;
