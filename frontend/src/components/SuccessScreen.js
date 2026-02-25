// src/components/SuccessScreen.js
import React from 'react';
import { CheckCircle, ArrowLeft, MapPin } from 'lucide-react'; // Added MapPin icon

const SuccessScreen = ({ remainingStock, branchName, onReset }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl max-w-sm w-full mx-auto">
      <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800">Check-In Successful!</h2>
      
      {/* Displaying the Branch Name */}
      <div className="flex items-center gap-1 text-gray-500 mt-2">
        <MapPin className="w-4 h-4" />
        <span className="text-sm font-medium">{branchName || "Branch Location"}</span>
      </div>
      
      <p className="text-gray-400 text-xs mt-1 text-center">Your usage has been logged and stock updated.</p>
      
      <div className="mt-8 p-6 bg-blue-50 rounded-2xl w-full text-center">
        <span className="text-xs text-blue-600 font-bold uppercase tracking-widest">
          Remaining Branch Stock
        </span>
        <p className="text-4xl font-black text-blue-900 mt-1">{remainingStock}</p>
      </div>

      <button 
        onClick={onReset}
        className="mt-10 flex items-center gap-2 text-gray-500 font-medium hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Log Another Tab
      </button>
    </div>
  );
};

export default SuccessScreen;