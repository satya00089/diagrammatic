import React from "react";
import { FiDownload } from "react-icons/fi";
import ThemeSwitcher from "./ThemeSwitcher";

type ToolbarProps = {
  onSaveImage: () => void;
};

const Toolbar: React.FC<ToolbarProps> = ({ onSaveImage }) => {
  return (
    <div className="flex items-center justify-between p-2 border-b bg-gray-100 dark:bg-gray-800">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
        Diagrammatic
      </h1>
      <div className="flex gap-2">
        <button
          onClick={onSaveImage}
          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          <FiDownload size={16} /> Save as Image
        </button>
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default Toolbar;
