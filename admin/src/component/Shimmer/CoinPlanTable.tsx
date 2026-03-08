import React from "react";
import "../../assets/scss/Shimmer/CoinPlanTable.css"; // create matching CSS for shimmer effect

const CoinPlanTable = () => {
  return (
    <tbody>
      {Array(8)
        .fill(0)
        .map((_, i) => (
          <tr key={i} style={{ height: "60px" }}>
            {/* No */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "20px" }}></div>
            </td>

            {/* UniqueId */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
            </td>

            {/* Sender/Receiver Name */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "120px" }}></div>
            </td>

            {/* Description */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "180px" }}></div>
            </td>

            {/* User Coin */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "80px" }}></div>
            </td>

            {/* Host Coin */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "80px" }}></div>
            </td>

            {/* Admin Coin */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "80px" }}></div>
            </td>

            {/* Agency Coin */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "80px" }}></div>
            </td>

            {/* Date */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
            </td>
          </tr>
        ))}
    </tbody>
  );
};

export default CoinPlanTable;
