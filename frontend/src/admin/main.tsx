import React from 'react';
import ReactDOM from 'react-dom/client';
import { StatisticsPanel } from '../components/StatisticsPanel';
import '../index.css';

const AdminApp = () => {
    return (
        <div className="min-h-screen bg-editor-bg text-gray-200">
            {/* Force the modal to remain open and act as the main view */}
            <StatisticsPanel isOpen={true} onClose={() => { }} />
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AdminApp />
    </React.StrictMode>
);
