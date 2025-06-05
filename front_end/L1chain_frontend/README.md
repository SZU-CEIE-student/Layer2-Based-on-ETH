# Python Flask L1 Explorer

这是一个使用Python和Flask构建的Web应用程序，用于查看L1链的区块链状态，并能够通过输入钱包地址查询该链的历史交易记录。

## 项目结构

```
L1chain_frontend
├── app.py                # 应用程序的入口文件
├── templates
│   ├── index.html       # 主页面模板，用户输入钱包地址
│   └── results.html     # 显示查询结果的模板
├── static
│   └── css
│       └── style.css    # 样式文件
├── requirements.txt      # 项目所需的Python依赖库
└── README.md             # 项目的文档
```

## 功能

- 查看L1链的区块链状态
- 输入钱包地址查询历史交易记录

## 安装

1. 克隆此项目：
   ```
   git clone <repository-url>
   cd L1chain_frontend
   ```

2. 创建并激活虚拟环境：
   ```
   python -m venv venv
   source venv/bin/activate  # 在Windows上使用 venv\Scripts\activate
   ```

3. 安装依赖：
   ```
   pip install -r requirements.txt
   ```

## 使用

1. 启动应用程序：
   ```
   python app.py
   ```

2. 打开浏览器并访问 `http://127.0.0.1:11000`。

3. 在主页面输入钱包地址以查询历史交易记录。

## 贡献

欢迎任何形式的贡献！请提交问题或拉取请求。