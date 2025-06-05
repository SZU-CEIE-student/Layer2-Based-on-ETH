# Layer2 & Rollup 环境安装说明

## 依赖环境

- [Foundry](https://book.getfoundry.sh/)
- [Homebrew](https://brew.sh/)

## 安装 Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup -i nightly
```

## 安装 Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## 安装 supersim
```bash
brew tap ethereum-optimism/tap
brew install supersim
```
## 启动supersim
```bash
./supersim
```

## 说明
请先安装 Homebrew，再安装 Foundry,再安装并启动supersim