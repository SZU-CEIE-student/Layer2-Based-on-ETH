# Anvil Transaction Generator

This project provides a simple way to generate transactions between preset Anvil accounts on a blockchain. It includes scripts to facilitate the transfer of funds between accounts and record these transactions on the blockchain.

## Project Structure

```
anvil-tx-generator
├── src
│   ├── generate_transactions.py  # Logic for generating transactions
│   └── accounts.py                # Definitions for Anvil preset accounts
├── requirements.txt               # Required Python libraries and dependencies
└── README.md                      # Project documentation
```

## Installation

To get started, clone the repository and install the required dependencies:

```bash
git clone <repository-url>
cd anvil-tx-generator
pip install -r requirements.txt
```

## Usage

1. **Define Accounts**: Modify the `src/accounts.py` file to include the necessary account details such as addresses and private keys.

2. **Generate Transactions**: Run the `src/generate_transactions.py` script to initiate transactions between the defined accounts. This script will handle the logic for transferring funds and recording the transactions.

```bash
python src/generate_transactions.py
```
如果python不可以用
```bash
python3 src/generate_transactions.py 
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.