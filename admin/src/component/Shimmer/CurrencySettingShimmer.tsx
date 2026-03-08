import React from "react";
import "../../assets/scss/Shimmer/CoinPlanShimmer.css";

const CurrencySettingShimmer = () => {
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
              {/* # */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "20px", height: "12px" }}
                ></div>
              </td>

             

              {/* Field 1 */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "30px", height: "12px" }}
                ></div>
              </td>

              {/* Field 2 */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "40px", height: "12px" }}
                ></div>
              </td>

               {/* Field 1 */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "30px", height: "12px" }}
                ></div>
              </td>

              {/* Field 1 */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "30px", height: "12px" }}
                ></div>
              </td>

             

              {/* Toggle 1 */}
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
                  className="skeleton skeleton-icon"
                  style={{ width: "28px", height: "28px", borderRadius: "8px" , display:"flex" , justifyContent:"end"}} 
                ></div>
              </td>

              {/* Delete Icon */}
              <td>
                <div
                  className="skeleton skeleton-icon"
                  style={{ width: "28px", height: "28px", borderRadius: "8px" }}
                ></div>
              </td>
            </tr>
          ))}
      </tbody>
    </>
  );
};

export default CurrencySettingShimmer;
