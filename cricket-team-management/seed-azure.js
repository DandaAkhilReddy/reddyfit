import { BlobServiceClient } from '@azure/storage-blob';
import * as dotenv from 'dotenv';

dotenv.config();

const accountName = process.env.VITE_AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

if (!accountName || !accountKey) {
  console.error('❌ Missing Azure credentials in .env file');
  process.exit(1);
}

const blobServiceClient = BlobServiceClient.fromConnectionString(
  `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`
);

const containerClient = blobServiceClient.getContainerClient('islandersdata');

// 12 players data
const players = [
  {
    id: 'akhil',
    email: 'akhil@islanderscricket.com',
    name: 'Akhil Reddy Danda',
    fullName: 'Akhil Reddy Danda',
    age: 25,
    battingStyle: 'Right-handed',
    bowlingStyle: 'Right-arm medium',
    roleType: 'Allrounder',
    equipmentReceived: {
      practiceTShirt: { received: false, size: null, date: null },
      matchTShirt: { received: false, size: null, date: null },
      cap: { received: false, size: null, date: null }
    },
    isActive: true
  },
  {
    id: 'faizan',
    email: 'faizan@islanderscricket.com',
    name: 'Faizan Mohammad',
    fullName: 'Faizan Mohammad',
    age: 24,
    battingStyle: 'Right-handed',
    bowlingStyle: 'Right-arm medium',
    roleType: 'Allrounder',
    equipmentReceived: {
      practiceTShirt: { received: false, size: null, date: null },
      matchTShirt: { received: false, size: null, date: null },
      cap: { received: false, size: null, date: null }
    },
    isActive: true
  },
  {
    id: 'nitish',
    email: 'nitish@islanderscricket.com',
    name: 'Nitish',
    fullName: 'Nitish',
    age: 26,
    battingStyle: 'Right-handed',
    bowlingStyle: 'Right-arm off-spin',
    roleType: 'Allrounder',
    equipmentReceived: {
      practiceTShirt: { received: false, size: null, date: null },
      matchTShirt: { received: false, size: null, date: null },
      cap: { received: false, size: null, date: null }
    },
    isActive: true
  },
  {
    id: 'dinesh',
    email: 'dinesh@islanderscricket.com',
    name: 'Dinesh Reddy',
    fullName: 'Dinesh Reddy',
    age: 27,
    battingStyle: 'Right-handed',
    bowlingStyle: 'Right-arm medium',
    roleType: 'Allrounder',
    equipmentReceived: {
      practiceTShirt: { received: false, size: null, date: null },
      matchTShirt: { received: false, size: null, date: null },
      cap: { received: false, size: null, date: null }
    },
    isActive: true
  },
  {
    id: 'charan',
    email: 'charan@islanderscricket.com',
    name: 'Charan',
    fullName: 'Charan',
    age: 23,
    battingStyle: 'Left-handed',
    bowlingStyle: 'Left-arm orthodox',
    roleType: 'Allrounder',
    equipmentReceived: {
      practiceTShirt: { received: false, size: null, date: null },
      matchTShirt: { received: false, size: null, date: null },
      cap: { received: false, size: null, date: null }
    },
    isActive: true
  },
  {
    id: 'sampath',
    email: 'sampath@islanderscricket.com',
    name: 'Sampath Reddy',
    fullName: 'Sampath Reddy',
    age: 25,
    battingStyle: 'Right-handed',
    bowlingStyle: 'None',
    roleType: 'Wicket Keeper',
    equipmentReceived: {
      practiceTShirt: { received: false, size: null, date: null },
      matchTShirt: { received: false, size: null, date: null },
      cap: { received: false, size: null, date: null }
    },
    isActive: true
  },
  {
    id: 'harshith',
    email: 'harshith@islanderscricket.com',
    name: 'Harshith',
    fullName: 'Harshith',
    age: 24,
    battingStyle: 'Left-handed',
    bowlingStyle: 'Left-arm medium',
    roleType: 'Allrounder',
    equipmentReceived: {
      practiceTShirt: { received: false, size: null, date: null },
      matchTShirt: { received: false, size: null, date: null },
      cap: { received: false, size: null, date: null }
    },
    isActive: true
  },
  {
    id: 'karthikeya',
    email: 'karthikeya@islanderscricket.com',
    name: 'Karthikeya',
    fullName: 'Karthikeya',
    age: 22,
    battingStyle: 'Right-handed',
    bowlingStyle: 'Right-arm leg-spin',
    roleType: 'Allrounder',
    equipmentReceived: {
      practiceTShirt: { received: false, size: null, date: null },
      matchTShirt: { received: false, size: null, date: null },
      cap: { received: false, size: null, date: null }
    },
    isActive: true
  },
  {
    id: 'pushkar',
    email: 'pushkar@islanderscricket.com',
    name: 'Pushkar',
    fullName: 'Pushkar',
    age: 23,
    battingStyle: 'Right-handed',
    bowlingStyle: 'Right-arm off-spin',
    roleType: 'Allrounder',
    equipmentReceived: {
      practiceTShirt: { received: false, size: null, date: null },
      matchTShirt: { received: false, size: null, date: null },
      cap: { received: false, size: null, date: null }
    },
    isActive: true
  },
  {
    id: 'farhan',
    email: 'farhan@islanderscricket.com',
    name: 'Farhan',
    fullName: 'Farhan',
    age: 24,
    battingStyle: 'Right-handed',
    bowlingStyle: 'Right-arm medium-fast',
    roleType: 'Allrounder',
    equipmentReceived: {
      practiceTShirt: { received: false, size: null, date: null },
      matchTShirt: { received: false, size: null, date: null },
      cap: { received: false, size: null, date: null }
    },
    isActive: true
  },
  {
    id: 'pardha',
    email: 'pardha@islanderscricket.com',
    name: 'Pardha',
    fullName: 'Pardha',
    age: 25,
    battingStyle: 'Right-handed',
    bowlingStyle: 'Right-arm medium',
    roleType: 'Allrounder',
    equipmentReceived: {
      practiceTShirt: { received: false, size: null, date: null },
      matchTShirt: { received: false, size: null, date: null },
      cap: { received: false, size: null, date: null }
    },
    isActive: true
  },
  {
    id: 'shaswath',
    email: 'shaswath@islanderscricket.com',
    name: 'Shaswath',
    fullName: 'Shaswath',
    age: 23,
    battingStyle: 'Right-handed',
    bowlingStyle: 'Right-arm fast',
    roleType: 'Bowler',
    equipmentReceived: {
      practiceTShirt: { received: false, size: null, date: null },
      matchTShirt: { received: false, size: null, date: null },
      cap: { received: false, size: null, date: null }
    },
    isActive: true
  }
];

async function uploadPlayer(player) {
  const blobName = `players/${player.id}.json`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const content = JSON.stringify(player, null, 2);

  await blockBlobClient.upload(content, content.length, {
    blobHTTPHeaders: { blobContentType: 'application/json' }
  });

  console.log(`✅ Uploaded: ${blobName}`);
}

async function main() {
  console.log('=================================');
  console.log('Seeding Azure Blob Storage');
  console.log('=================================\n');

  console.log(`Storage Account: ${accountName}`);
  console.log(`Container: islandersdata\n`);

  // Create container if it does not exist
  console.log('Checking container...');
  try {
    await containerClient.createIfNotExists({ access: 'blob' });
    console.log('✅ Container ready\n');
  } catch (err) {
    console.log('⚠️  Container may already exist, continuing...\n');
  }

  console.log('Uploading 12 players...\n');

  for (const player of players) {
    await uploadPlayer(player);
  }

  console.log('\n=================================');
  console.log('✅ Seed Complete!');
  console.log('=================================');
  console.log(`\n${players.length} players uploaded to Azure Blob Storage`);
  console.log('\nView at: https://portal.azure.com');
  console.log('Storage Account → islanderscricket → Containers → islandersdata\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
