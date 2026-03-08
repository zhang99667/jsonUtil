import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { adminTheme } from './styles/theme'
import './styles/admin.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ConfigProvider theme={adminTheme} locale={zhCN}>
            <App />
        </ConfigProvider>
    </React.StrictMode>,
)
