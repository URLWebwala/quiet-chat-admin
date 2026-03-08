import React from "react";
import "../../assets/scss/Shimmer/WithdrawerShimmer.css";

const WithdrawerShimmer = () => {
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
      <tr key={i} style={{ height: "50px" }}>
        {/* No */}
        <td style={{ textAlign: "center", width: "50px" }}>
          <div className="skeleton skeleton-text" style={{ width: "20px", height: "14px" }}></div>
        </td>

        {/* Unique ID */}
       <td style={{paddingLeft: "100px"}}>
          <div className="skeleton skeleton-text" style={{ width: "100px", height: "14px"  }}></div>
        </td>

        {/* Agency / Host: Profile Image + Name + ID */}
        <td style={{paddingLeft: "200px"}}>
          <div className="d-flex align-items-center" style={{ gap: "10px", minWidth: "300px" }}>
            <div className="skeleton skeleton-circle" style={{ width: "60px", height: "60px" }}></div>
            <div>
              <div className="skeleton skeleton-text" style={{ width: "120px", height: "16px", marginBottom: "6px" }}></div>
              <div className="skeleton skeleton-text" style={{ width: "90px", height: "14px" }}></div>
            </div>
          </div>
        </td>

        {/* Coin Icon + Coin Value */}
        <td style={{paddingRight: "100px"}}>
          <div className="d-flex align-items-center" style={{ gap: "10px" }}>
            <div className="skeleton" style={{ width: "25px", height: "25px", borderRadius: "50%" }}></div>
            <div className="skeleton skeleton-text" style={{ width: "60px", height: "14px" }}></div>
          </div>
        </td>

        {/* Amount */}
        <td style={{paddingRight: "70px"}}>
          <div className="skeleton skeleton-text" style={{ width: "30px", height: "14px" }}></div>
        </td>

        {/* Request Date */}
        <td>
          <div className="skeleton skeleton-text" style={{ width: "100px", height: "14px" }}></div>
        </td>

        {/* Info Button */}
        <td>
          <div className="skeleton skeleton-icon" style={{ width: "30px", height: "30px", borderRadius: "50%" }}></div>
        </td>

          {/* <td>
            <div className="skeleton skeleton-icon" style={{ width: "30px", height: "30px", borderRadius: "8px" }}></div>
          </td>

          <td>
            <div className="skeleton skeleton-icon" style={{ width: "30px", height: "30px", borderRadius: "8px" }}></div>
          </td> */}
      </tr>
    ))}
</tbody>

    </>
  );
};

export default WithdrawerShimmer;




