import React from "react";

const PlanPurchaseHistoryShimmer = () => {
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

            {/* User */}
            <td style={{ paddingLeft: "19px" }}>
                <div
                  className="d-flex align-items-center gap-2"
                  style={{ width: "250px" , paddingLeft: "25px"}}
                >
                  <div
                    className="skeleton skeleton-circle"
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                    }}
                  ></div>
                  <div className="d-flex flex-column justify-content-center">
                    <div
                      className="skeleton skeleton-text"
                      style={{
                        width: "100px",
                        height: "14px",
                        marginBottom: "4px",
                      }}
                    ></div>
                    <div
                      className="skeleton skeleton-text"
                      style={{ width: "70px", height: "12px" }}
                    ></div>
                  </div>
                </div>
              </td>

            {/* Total Spent */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "120px" }}></div>
            </td>

            {/* Plans Bought */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "180px" }}></div>
            </td>

            {/* Date */}
           <td style={{ width: "80px", textAlign: "center" }}>
                <div className="skeleton skeleton-icon" style={{ width: "30px", height: "30px", borderRadius: "8px" }} />
              </td>
          </tr>
        ))}
    </tbody>
  );
};

export default PlanPurchaseHistoryShimmer;
