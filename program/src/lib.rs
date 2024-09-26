use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::{invoke_signed, invoke},
    pubkey::Pubkey,
    rent::Rent,
    system_instruction::create_account,
    sysvar::Sysvar,
    system_instruction,
    program_error::INVALID_INSTRUCTION_DATA
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    if let Ok(vault) = Vault::try_from_slice(instruction_data) {
        return create_vault(program_id, accounts, vault);
    };
    if let Ok(deposit) = Deposit::try_from_slice(instruction_data) {
        return deposit_vault(accounts, deposit.amount);
    }

    if let Ok(withdraw) = Withdraw::try_from_slice(instruction_data) {
        return withdraw_vault(accounts);
    }

    Err(INVALID_INSTRUCTION_DATA.into())

}

pub fn create_vault(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    vault: Vault,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let vault_account = next_account_info(accounts_iter)?;
    let user = next_account_info(accounts_iter)?;
    let payer = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    let account_span = (vault.try_to_vec()?).len();
    let lamports_required = (Rent::get()?).minimum_balance(account_span);

    invoke_signed(
        &system_instruction::create_account(
            payer.key,
            vault_account.key,
            lamports_required,
            account_span as u64,
            program_id,
        ),
        &[
            payer.clone(),
            vault_account.clone(),
            system_program.clone(),
        ],
        &[&[
            Vault::SEED_PREFIX.as_bytes(),
            user.key.as_ref(),
            &[vault.bump],
        ]],
    )?;

    Ok(())
}


pub fn deposit_vault(accounts: &[AccountInfo], amount: u64) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let vault_account = next_account_info(accounts_iter)?;
    let payer = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    let vault = &mut Vault::try_from_slice(&vault_account.data.borrow())?;

    vault.deposit(amount);

    invoke(
        &system_instruction::transfer(payer.key, vault_account.key, amount),
        &[vault_account.clone(), payer.clone() ],
    )?;

    msg!("Deposit amount:{}", amount);

    vault.serialize(&mut &mut vault_account.data.borrow_mut()[..])?;
    Ok(())
}

pub fn withdraw_vault(accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let vault_account = next_account_info(accounts_iter)?;
    let payer = next_account_info(accounts_iter)?;
    let vault = &mut Vault::try_from_slice(&vault_account.data.borrow())?;
    let current_amount = vault.amount;
    // get 10% of total vault 
    let withdraw_amount = (current_amount*10)/100;
    msg!("Withdraw amount:{}", withdraw_amount);
    vault.withdraw(withdraw_amount);
    invoke(
        &system_instruction::transfer(vault_account.key, payer.key, withdraw_amount),
        &[vault_account.clone(), payer.clone()],
    )?;

    vault.serialize(&mut &mut vault_account.data.borrow_mut()[..])?;
    Ok(())
}




#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct Withdraw {}


#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct Deposit {
    pub amount: u64
}


#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct Vault {
    pub amount: u64,
    pub bump: u8,
}

impl Vault {
    pub const ACCOUNT_SPACE: usize = 8 + 64;

    pub const SEED_PREFIX: &'static str = "vault";

    pub fn new(amount: u64, bump: u8) -> Self {
        Vault { amount, bump }
    }

    pub fn deposit(&mut self, deposit_amount : u64) {
        self.amount += deposit_amount;
    }
    pub fn withdraw(&mut self, withdraw_amount: u64) {


        self.amount -= withdraw_amount;  
    }
}

