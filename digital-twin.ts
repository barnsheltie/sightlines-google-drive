// digital-twin.ts
import { google } from 'googleapis';
import { UserMetadata } from './user-metadata';

class DigitalTwin {
  private users: UserMetadata[];
  private auth: google.auth.JWT;

  constructor(users: UserMetadata[]) {
    this.users = users;
    this.auth = new google.auth.JWT(
      process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY,
      ['https://www.googleapis.com/auth/drive.readonly']
    );
  }
  async authenticate() {
    try {
      await this.auth.authorize();
    } catch (error) {
      console.error(`Error authenticating with Google Drive: ${error}`);
    }
  }


  async synchronizeUserMetadata() {
    const drive = google.drive('v3');
    const usersToSync = this.users.filter(user => user.googleDriveUserId !== null);

    for (const user of usersToSync) {
      try {
        const response = await drive.files.list({
          q: `'${user.googleDriveUserId}' in owners`,
          fields: 'files(id, name, mimeType, parents)',
        });

        const files = response.data.files;
        user.totalFiles = files.length;

        for (const file of files) {
          if (file.mimeType === 'application/vnd.google-apps.folder') {
            user.totalFolders++;
            const folderContents = await drive.files.list({
              q: `'${file.id}' in parents`,
              fields: 'files(id, name, mimeType)',
            });
            user.folders.push({
              url: file.alternateLink,
              contents: folderContents.data.files,
            });
          }
        }
        // Update the digital twin with the synchronized metadata
        this.updateUserMetadata(user);
      } catch (error) {
        console.error(`Error synchronizing user metadata for ${user.googleDriveUserId}: ${error}`);
      }
    }
  }

  private updateUserMetadata(user: UserMetadata) {
    const existingUserIndex = this.users.findIndex(
        existingUser => existingUser.googleDriveUserId === user.googleDriveUserId
    );

    if (existingUserIndex !== -1) {
        this.users[existingUserIndex] = user;
    } else {
        this.users.push(user);
    }
}
  
}

export { DigitalTwin };