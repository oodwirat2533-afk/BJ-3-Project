import React from 'react';
import { CheckCircleIcon, WarningIcon, RefreshIcon } from './Icons';

interface NotificationModalProps {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ title, message, type, onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="h-16 w-16 text-green-500" />;
            case 'warning':
                return <WarningIcon className="h-16 w-16 text-yellow-500" />;
            case 'error':
                return <WarningIcon className="h-16 w-16 text-red-500" />;
            case 'info':
            default:
                return <RefreshIcon className="h-16 w-16 text-indigo-500" />;
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case 'success': return 'bg-green-600 hover:bg-green-700';
            case 'warning': return 'bg-yellow-600 hover:bg-yellow-700';
            case 'error': return 'bg-red-600 hover:bg-red-700';
            default: return 'bg-indigo-600 hover:bg-indigo-700';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 transform transition-all animate-scale-in">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-6 bg-gray-50 p-4 rounded-full">
                        {getIcon()}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">{title}</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed whitespace-pre-wrap">{message}</p>
                    <button
                        onClick={onClose}
                        className={`w-full text-white font-bold py-3.5 px-6 rounded-xl transition-all active:scale-95 shadow-lg ${getButtonClass()}`}
                    >
                        ตกลง
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
