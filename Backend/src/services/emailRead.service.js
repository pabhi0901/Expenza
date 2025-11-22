import { simpleParser } from "mailparser";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const ecommerceSites = [
  "amazon.in",
  "flipkart.com",
  "myntra.com",
  "meesho.com",
  "zomato.com",
  "swiggy.in",
  "instamart.in"
];

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

let getGmailsOfUser = async (user) => {

  // Step 1: Oauth instance
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    refresh_token: user.googleRefreshToken
  });

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  // Step 2: query generate
  const formattedDate = formatDate(user.lastSynced);
  const filterQuery = `after:${formattedDate} (${ecommerceSites
    .map(e => `from:${e}`)
    .join(" OR ")})`;

  console.log("Query:", filterQuery);

  // Step 3: list messages
  const list = await gmail.users.messages.list({
    userId: "me",
    q: filterQuery,
    maxResults: 100
  });

  if (!list.data.messages) {
    console.log("No new e-commerce mails.");
    return [];
  }

  const finalMails = [];

  // Step 4: read full messages
  for (const m of list.data.messages) {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: m.id,
      format: "raw"
    });

    const mail = await simpleParser(
      Buffer.from(msg.data.raw, "base64")
    );

    finalMails.push({
      subject: mail.subject,
      from: mail.from.text,
      text: mail.text,
      html: mail.html
    });
  }

  console.log("Fetched", finalMails.length, "emails");
  // console.log(finalMails);
  

  return finalMails;
};

export default getGmailsOfUser;
