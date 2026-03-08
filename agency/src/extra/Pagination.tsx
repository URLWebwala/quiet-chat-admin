import React, { useMemo } from "react";
import { Select } from "./Input";

interface PaginationProps {
  type: string;
  serverPage: number;
  setServerPage: (page: number) => void;
  serverPerPage: number;
  onPageChange: (event: React.MouseEvent | null, page: number) => void;
  onRowsPerPageChange: (value: string) => void;
  totalData: number;
}

const Pagination: React.FC<PaginationProps> = ({
  serverPage,
  setServerPage,
  serverPerPage,
  onPageChange,
  onRowsPerPageChange,
  totalData
}) => {
  // Memoized calculation of pagination details
  const paginationDetails = useMemo(() => {
    const totalPages = Math.ceil(totalData / serverPerPage);
    const currentPage = serverPage; // Already 1-based

    const generatePageRange = () => {
      const range = 3;
      let start = Math.max(1, currentPage - Math.floor(range / 2));
      const end = Math.min(start + range - 1, totalPages);

      start = Math.max(1, end - range + 1);
      return Array.from({ length: Math.min(range, totalPages) }, (_, i) => start + i);
    };

    return {
      totalPages,
      currentPage,
      pageRange: generatePageRange(),
      startIndex: (serverPage - 1) * serverPerPage + 1,
      endIndex: Math.min(serverPage * serverPerPage, totalData)
    };
  }, [serverPage, serverPerPage, totalData]);

  // Rows per page options
  const rowsPerPageOptions = [1, 2, 3, 5, 10, 25, 50, 100];

  // Disable state checks
  const isFirstPage = serverPage === 1;
  const isLastPage = serverPage === paginationDetails.totalPages;



  return totalData > 0 ? (
    <div className="pagination">
      <div className="client-pagination betBox w-100">
        {/* Rows per page selector */}
        <div className="tableRang midBox">
          <Select
            id="pagination"
            option={rowsPerPageOptions}
            defaultValue={serverPerPage}
            label="Show"
            onChange={(value: string) => {
              // Convert to string to match your existing handler
              onRowsPerPageChange(value);
            }}
            className="midBox"
            btnClass="mt-0"
          />
          <p className="count">
            {`${paginationDetails.startIndex} - ${paginationDetails.endIndex} of ${totalData}`}
          </p>
        </div>

        {/* Pagination controls */}
        <div className="tableAccess">
          <div className="d-flex m15-left mainPaginatinBtn">
            {/* First page button */}
            <button
              className={`paginationBtn ${isFirstPage ? 'pageBtnDisable' : ''}`}
              disabled={isFirstPage}
              onClick={() => onPageChange(null, 1)}
              style={{ backgroundColor: "#fff", fontSize: "29px", color: isFirstPage ? "#b7b7b7" : "#000" }}
            >
              {"«"}
            </button>

            {/* Previous page button */}
            <button
              className={`paginationBtn ${isFirstPage ? 'pageBtnDisable' : ''}`}
              disabled={isFirstPage}
              onClick={() => onPageChange(null, serverPage - 1)}
              style={{ backgroundColor: "#fff", fontSize: "29px", color: isFirstPage ? "#b7b7b7" : "#000" }}
            >
              {"‹"}
            </button>

            {/* Page number buttons */}
            {paginationDetails.pageRange.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(null, pageNum)}
                className={`paginationBtn paginationNumber ${paginationDetails.currentPage === pageNum ? 'active' : 'active-btn'
                  }`}
              >
                {pageNum}
              </button>
            ))}


            {/* Next page button */}
            <button
              className={`paginationBtn ${isLastPage ? 'pageBtnDisable' : ''}`}
              disabled={isLastPage}
              onClick={() => onPageChange(null, serverPage + 1)}
              style={{ backgroundColor: "#fff", fontSize: "29px", color: isLastPage ? "#b7b7b7" : "#000" }}
            >
              {"›"}
            </button>

            {/* Last page button */}
            <button
              className={`paginationBtn ${isLastPage ? 'pageBtnDisable' : ''}`}
              disabled={isLastPage}
              onClick={() => onPageChange(null, paginationDetails.totalPages)}
              style={{ backgroundColor: "#fff", fontSize: "29px", color: isLastPage ? "#b7b7b7" : "#000" }}
            >
              {"»"}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default Pagination;