// user-metadata.ts
interface UserMetadata {
  totalFiles: number;
  totalFolders: number;
  folders: FolderMetadata[];
}

interface FolderMetadata {
  url: string;
  contents: ItemMetadata[];
}

interface ItemMetadata {
  url: string;
  accessPermissions: string[]; // user IDs or emails
}




