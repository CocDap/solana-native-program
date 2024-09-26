# Solana Fellowship Program 2024 - Module 4 - Native Program
Build a native Solana program to create initialize an account, deposit SOL into it, and withdraw 10% of the deposited SOL at a given time from it.


## Features
- [x] Deposit SOL to PDA account 
- [x] Withdraw SOL from PDA account to user 

## Build project

- Build the project
  ```bash
  yarn install
  ```
- Run the native program
  ```bash
    cd program
    cargo build-sbf
  ```

## Run project and deploy 
### Start a local test validator

```bash
solana-test-validator
```


### Test
```bash
yarn test
```

### Run client
```bash
yarn client
```


Link Playground:

https://beta.solpg.io/66f5a348cffcf4b13384d3a3

Author: Dustin

