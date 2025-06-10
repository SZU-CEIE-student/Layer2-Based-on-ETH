// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOptimismPortal {
    function finalizeWithdrawalTransaction(bytes calldata _tx) external;
}

contract L1FastBridge {
    address public owner;
    address public optimismPortal;
    address public liquidityProvider;

    // 已经处理的提款请求
    mapping(bytes32 => bool) public processedWithdrawals;

    // 用于跟踪快速提款的事件
    event FastWithdrawalCompleted(
        address indexed recipient,
        uint256 amount,
        uint256 requestId
    );

    constructor(address _optimismPortal, address _liquidityProvider) {
        owner = msg.sender;
        optimismPortal = _optimismPortal;
        liquidityProvider = _liquidityProvider;
    }

    // LP调用此函数完成快速提款
    function completeFastWithdrawal(
        address _recipient,
        uint256 _amount,
        uint256 _requestId
    ) external {
        require(msg.sender == liquidityProvider, "Only LP can call");

        // 生成唯一标识符
        bytes32 withdrawalId = keccak256(
            abi.encodePacked(_recipient, _amount, _requestId)
        );

        // 检查是否已经处理过
        require(!processedWithdrawals[withdrawalId], "Already processed");

        // 标记为已处理
        processedWithdrawals[withdrawalId] = true;

        // 发送事件通知中继器
        emit FastWithdrawalCompleted(_recipient, _amount, _requestId);
    }

    // LP使用此函数在挑战期后完成标准提款
    function finalizeStandardWithdrawal(bytes calldata _txData) external {
        require(msg.sender == liquidityProvider, "Only LP can call");

        // 调用OptimismPortal完成提款
        IOptimismPortal(optimismPortal).finalizeWithdrawalTransaction(_txData);
    }

    // 更新LP地址
    function setLiquidityProvider(address _newLP) external {
        require(msg.sender == owner, "Only owner");
        liquidityProvider = _newLP;
    }

    // 接收ETH
    receive() external payable {}
}
