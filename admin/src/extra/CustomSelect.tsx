import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaCheck, FaSearch } from "react-icons/fa";

export interface CustomSelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  options: (CustomSelectOption | string)[];
  value: string | number | undefined | null;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  searchable?: boolean;
  size?: "sm" | "md" | "lg";
  name?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  style = {},
  searchable = false,
  size = "md",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to objects
  const normalizedOptions: CustomSelectOption[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Find selected option
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      opt.label.toLowerCase().includes(query) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(query)) ||
      String(opt.value).toLowerCase().includes(query)
    );
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen, searchable]);

  const handleSelect = (optValue: string | number) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const getHeight = () => {
    switch (size) {
      case "sm":
        return "36px";
      case "lg":
        return "48px";
      default:
        return "42px";
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "sm":
        return "13px";
      case "lg":
        return "15px";
      default:
        return "13.5px";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-wrapper position-relative ${className}`}
      style={{ minWidth: "140px", width: "100%", ...style }}
    >
      <style jsx>{`
        .custom-select-trigger {
          border-radius: 6px !important;
          border: 1.5px solid #cbd5e1;
          background-color: #ffffff;
          padding: 0 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #0f172a;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: all 0.15s ease;
          user-select: none;
        }
        .custom-select-trigger:hover:not(.disabled) {
          border-color: #94a3b8;
        }
        .custom-select-trigger.active {
          border-color: #8f6dff !important;
          box-shadow: 0 0 0 3px rgba(143, 109, 255, 0.2) !important;
        }
        .custom-select-trigger.disabled {
          background-color: #f8fafc !important;
          color: #94a3b8 !important;
          border-color: #e2e8f0 !important;
          cursor: not-allowed;
        }
        .custom-dropdown-panel {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 9999;
          background: #ffffff;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
          max-height: 280px;
          overflow-y: auto;
          padding: 4px;
          animation: dropIn 0.15s ease-out;
        }
        @keyframes dropIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .custom-dropdown-item {
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 13.5px;
          color: #1e293b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.1s ease;
        }
        .custom-dropdown-item:hover {
          background-color: #f3f0ff;
          color: #6d28d9;
        }
        .custom-dropdown-item.selected {
          background-color: #8f6dff !important;
          color: #ffffff !important;
          font-weight: 600;
        }
        .custom-dropdown-item.selected .text-muted {
          color: rgba(255, 255, 255, 0.8) !important;
        }
        .chevron-icon {
          transition: transform 0.2s ease;
          color: #64748b;
          font-size: 11px;
        }
        .chevron-icon.rotate {
          transform: rotate(180deg);
          color: #8f6dff;
        }
      `}</style>

      {/* Select Trigger Box */}
      <div
        className={`custom-select-trigger ${isOpen ? "active" : ""} ${disabled ? "disabled" : ""}`}
        style={{ height: getHeight(), fontSize: getFontSize() }}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
      >
        <div className="d-flex align-items-center gap-2 text-truncate">
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          <span className={`text-truncate ${!selectedOption ? "text-muted" : "fw-medium text-dark"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.subLabel && (
            <span className="text-muted fs-11 text-truncate">({selectedOption.subLabel})</span>
          )}
        </div>
        <FaChevronDown className={`chevron-icon flex-shrink-0 ${isOpen ? "rotate" : ""}`} />
      </div>

      {/* Dropdown Options Popup */}
      {isOpen && (
        <div className="custom-dropdown-panel">
          {searchable && (
            <div className="p-1 mb-1 border-bottom">
              <div className="position-relative">
                <FaSearch
                  className="position-absolute text-muted"
                  style={{ left: 8, top: 9, fontSize: 11 }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-control form-control-sm ps-4 fs-12 border-0 bg-light"
                  style={{ borderRadius: "4px", outline: "none", boxShadow: "none" }}
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-muted fs-12">No matching options</div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={String(opt.value)}
                  className={`custom-dropdown-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <div className="d-flex align-items-center gap-2 text-truncate">
                    {opt.icon && <span>{opt.icon}</span>}
                    <span className="text-truncate">{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-muted fs-11 text-truncate">({opt.subLabel})</span>
                    )}
                  </div>
                  {isSelected && <FaCheck className="fs-12 flex-shrink-0 ms-2" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
