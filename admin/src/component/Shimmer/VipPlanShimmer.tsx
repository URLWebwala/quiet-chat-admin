import React from "react";
import "../../assets/scss/Shimmer/VipPlanShimmer.css";

const VipPlanShimmer = () => {
  return (
    <>
      <thead>
        <tr style={{ height: "50px" }}>
          <th scope="col"></th>
          <th scope="col"></th>
          <th scope="col"></th>
          <th scope="col"></th>
          <th scope="col"></th>
        </tr>
      </thead>
      <tbody>
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <tr key={i} style={{ height: "60px" }}>
              {/* Index */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "20px", height: "12px" }}
                ></div>
              </td>

             

              {/* Quantity */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "30px", height: "12px" }}
                ></div>
              </td>

              {/* Amount */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "40px", height: "12px" }}
                ></div>
              </td>

              {/* Identifier String (like com.app.coin.X) */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "60px", height: "12px" }}
                ></div>
              </td>

               {/* Coin Icon + Value */}
              <td>
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="skeleton"
                    style={{
                      width: "25px",
                      height: "25px",
                      borderRadius: "50%",
                    }}
                  ></div>
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "40px", height: "12px" }}
                  ></div>
                </div>
              </td>

             

              {/* Toggle 2 */}
              <td>
                <div
                  className="skeleton"
                  style={{
                    width: "40px",
                    height: "20px",
                    borderRadius: "10px",
                  }}
                ></div>
              </td>

              {/* Edit Icon */}
              <td>
                <div
                  className="skeleton"
                  style={{ width: "28px", height: "28px", borderRadius: "8px" }}
                ></div>
              </td>

              {/* Delete Icon */}
              <td>
                <div
                  className="skeleton"
                  style={{ width: "28px", height: "28px", borderRadius: "8px" }}
                ></div>
              </td>
            </tr>
          ))}
      </tbody>
    </>
  );
};

export default VipPlanShimmer;
