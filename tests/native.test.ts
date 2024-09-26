import * as borsh from "borsh";
import * as web3 from "@solana/web3.js";
import { Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
// Manually initialize variables that are automatically defined in Playground
const PROGRAM_ID = new web3.PublicKey("H1EsMnU3YhiPqvftWxM9RcaNAy57okNwrDPnMBt15VUZ");
const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");
const wallet = { keypair: web3.Keypair.generate() };


describe("Vault Test", () => {
  const newAccountKp = new web3.Keypair();
  // it("create vault", async () => {
  //   // Generate keypair for the new account
  //   const newAccountKp = new web3.Keypair();

  //   const instructionIndex = 0;
  //   const data = 42;

  //   // Create instruction data buffer
  //   const instructionData = Buffer.alloc(1 + 8);
  //   instructionData.writeUInt8(instructionIndex, 0);
  //   instructionData.writeBigUInt64LE(BigInt(data), 1);

  //   const instruction = new web3.TransactionInstruction({
  //     keys: [
  //       {
  //         pubkey: newAccountKp.publicKey,
  //         isSigner: true,
  //         isWritable: true,
  //       },
  //       {
  //         pubkey: wallet.keypair.publicKey,
  //         isSigner: true,
  //         isWritable: true,
  //       },
  //       {
  //         pubkey: web3.SystemProgram.programId,
  //         isSigner: false,
  //         isWritable: false,
  //       },
  //     ],
  //     programId: PROGRAM_ID,
  //     data: instructionData,
  //   });

  //   const transaction = new web3.Transaction().add(instruction);

  //   const txHash = await web3.sendAndConfirmTransaction(
  //     connection,
  //     transaction,
  //     [wallet.keypair, newAccountKp]
  //   );
  //   console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

  //   // Fetch Account
  //   const newAccount = await connection.getAccountInfo(
  //     newAccountKp.publicKey
  //   );

  //   // Deserialize Account Data
  //   const deserializedAccountData = borsh.deserialize(
  //     AccountDataSchema,
  //     AccountData,
  //     newAccount.data
  //   );

  //   console.log(Number(deserializedAccountData.data));
  // });

  it('Create a test user', async () => {
    const instruction = SystemProgram.createAccount({
      fromPubkey: wallet.keypair.publicKey,
      lamports: Number(connection.getMinimumBalanceForRentExemption(0)),
      newAccountPubkey: newAccountKp.publicKey,
      programId: SystemProgram.programId,
      space: 0,
    });

    const transaction = new web3.Transaction().add(instruction);

    const txHash = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.keypair, newAccountKp]
    );

    console.log(`Local Wallet: ${wallet.keypair.publicKey}`);
    console.log(`Created User: ${newAccountKp.publicKey}`);
  });



  it('Create vault', async () => {
    const [vaultPda, bump] = deriveVaultPda(newAccountKp.publicKey);
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: newAccountKp.publicKey, isSigner: false, isWritable: false },
        { pubkey: wallet.keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: new Vault({ amount: 0, bump: bump }).toBuffer(),
    });
    const transaction = new web3.Transaction().add(instruction);

    const txHash = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.keypair]
    );
    console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
  });


  it('Get the current vault', async () => {
    const [vaultPda, _] = deriveVaultPda(newAccountKp.publicKey);
    //const accountInfo = await client.getAccount(pageVisitsPda);
    const accountInfo = await connection.getAccountInfo(
      vaultPda
    );
    const deserializedAccountData = borsh.deserialize(
      VaultSchema,
      Vault,
      accountInfo.data
    );
    console.log("Vault amount:", deserializedAccountData);

  });

  it('Deposit amount to vault', async () => {
    const [vaultPda, bump] = deriveVaultPda(newAccountKp.publicKey);
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: wallet.keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: new DepositVault({amount: 5000000000}).toBuffer(),
    });

    const transaction = new web3.Transaction().add(instruction);

    const txHash = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.keypair]
    );
    console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
  });

  it('Get the current vault after depositing', async () => {
    const [vaultPda, _] = deriveVaultPda(newAccountKp.publicKey);
    //const accountInfo = await client.getAccount(pageVisitsPda);
    const accountInfo = await connection.getAccountInfo(
      vaultPda
    );
    const deserializedAccountData = borsh.deserialize(
      VaultSchema,
      Vault,
      accountInfo.data
    );
    console.log("Vault amount after depositing:", deserializedAccountData);

  });

  it('Withdraw amount to vault', async () => {
    const [vaultPda, bump] = deriveVaultPda(newAccountKp.publicKey);
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: wallet.keypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: new WithdrawVault({}).toBuffer(),
    });

    const transaction = new web3.Transaction().add(instruction);

    const txHash = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet.keypair]
    );
    console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
  });


  it('Get the current vault after withdrawing', async () => {
    const [vaultPda, _] = deriveVaultPda(newAccountKp.publicKey);
    //const accountInfo = await client.getAccount(pageVisitsPda);
    const accountInfo = await connection.getAccountInfo(
      vaultPda
    );
    const deserializedAccountData = borsh.deserialize(
      VaultSchema,
      Vault,
      accountInfo.data
    );
    console.log("Vault amount after withdrawing:", deserializedAccountData);

  });


});



function deriveVaultPda(userPubkey: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from('vault'), userPubkey.toBuffer()], PROGRAM_ID);
}



class Assignable {
  constructor(properties) {
    for (const [key, value] of Object.entries(properties)) {
      this[key] = value;
    }
  }
}

class Vault extends Assignable {
  toBuffer() {
    return Buffer.from(borsh.serialize(VaultSchema, this));
  }

  static fromBuffer(buffer: Buffer) {
    return borsh.deserialize(VaultSchema, Vault, buffer);
  }
}
const VaultSchema = new Map([
  [
    Vault,
    {
      kind: 'struct',
      fields: [
        ['amount', 'u64'],
        ['bump', 'u8'],
      ],
    },
  ],
]);

class DepositVault extends Assignable {
  toBuffer() {
    return Buffer.from(borsh.serialize(DepositVaultSchema, this));
  }
}
const DepositVaultSchema = new Map([
  [
    DepositVault,
    {
      kind: 'struct',
      fields: [['amount', 'u64'],],
    },
  ],
]);


class WithdrawVault extends Assignable {
  toBuffer() {
    return Buffer.from(borsh.serialize(WithdrawVaultSchema, this));
  }
}
const WithdrawVaultSchema = new Map([
  [
    WithdrawVault,
    {
      kind: 'struct',
      fields: [],
    },
  ],
]);
