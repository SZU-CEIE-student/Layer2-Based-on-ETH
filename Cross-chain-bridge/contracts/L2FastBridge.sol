// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IL2StandardBridge {
    function withdrawTo(
        address _l2Token,
        address _to,
        uint256 _amount,
        uint32 _minGasLimit,
        bytes calldata _data
    ) external;
}

contract L2FastBridge {
    address public owner;
    address public l2StandardBridge;
    address public liquidityProvider;
    
    // 用于跟踪提款请求的事件
    event FastWithdrawalInitiated(
        address indexed user,
        address indexed recipient,
        uint256 amount,
        uint256 requestId
    );
    
    // 用于跟踪每个用户的提款请求ID
    uint256 private requestIdCounter;
    
    constructor(address _l2StandardBridge, address _liquidityProvider) {
        owner = msg.sender;
        l2StandardBridge = _l2StandardBridge;
        liquidityProvider = _liquidityProvider;
    }
    
    // 用户调用此函数发起快速提款
    function fastWithdraw(address _recipient) external payable {
        require(msg.value > 0, "Must send ETH");
        
        // 生成唯一的请求ID
        uint256 requestId = requestIdCounter++;
        
        // 向LP转账资金
        payable(liquidityProvider).transfer(msg.value);
        
        // 发出事件通知中继器
        emit FastWithdrawalInitiated(
            msg.sender,
            _recipient,
            msg.value,
            requestId
        );
    }
    
    // 只有LP可以调用这个函数来发起标准提款
    function initiateStandardWithdrawal(address _recipient, uint256 _amount) external {
        require(msg.sender == liquidityProvider, "Only LP can call");
        
        // 调用标准桥合约触发正常提款流程
        IL2StandardBridge(l2StandardBridge).withdrawTo(
            address(0), // ETH表示为0地址
            _recipient,
            _amount,
            100000, // 固定gas limit
            bytes("") // 空数据
        );
    }
    
    // 更新LP地址
    function setLiquidityProvider(address _newLP) external {
        require(msg.sender == owner, "Only owner");
        liquidityProvider = _newLP;
    }
    
    // 接收ETH
    receive() external payable {}
}
