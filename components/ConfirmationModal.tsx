
import React from 'react';

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    title, 
    message, 
    confirmText = 'ยืนยัน', 
    cancelText = 'ยกเลิก', 
    onConfirm, 
    onCancel,
    confirmButtonClass = 'bg-red-600 hover:bg-red-700'
}) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center w-full max-w-md mx-4 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
            <p className="text-gray-600 mb-8">{message}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">
                    {cancelText}
                </button>
                <button onClick={onConfirm} className={`text-white font-bold py-2 px-6 rounded-lg transition-colors ${confirmButtonClass}`}>
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
);

export default ConfirmationModal;
