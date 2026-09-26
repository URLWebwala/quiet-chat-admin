import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../utils/config";
import Title from "../component/extra/Title";
import Table from "../component/extra/Table";

const PushNotificationHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${baseURL}/admin/notification/history`);
        if (response.data.status) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch notification history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    {
      name: "No.",
      selector: (row: any, index: number) => index + 1,
      width: "80px",
    },
    {
      name: "Image",
      selector: (row: any) => row.image,
      cell: (row: any) =>
        row.image ? (
          <img src={baseURL + "/" + row.image} alt="Notification" width="50" height="50" style={{ borderRadius: "5px", objectFit: "cover" }} />
        ) : (
          "No Image"
        ),
      width: "120px",
    },
    {
      name: "Title",
      selector: (row: any) => row.title,
    },
    {
      name: "Message",
      selector: (row: any) => row.message,
    },
    {
      name: "Sent To",
      selector: (row: any) => row.notificationType || "N/A",
    },
    {
      name: "Total Sent",
      selector: (row: any) => row.totalSent,
    },
    {
      name: "Delivered",
      selector: (row: any) => row.totalDelivered,
    },
    {
      name: "Opened",
      selector: (row: any) => row.totalOpened,
    },
    {
      name: "Date",
      selector: (row: any) => row.date,
    },
  ];

  return (
    <div className="main-content">
      <Title name="Push Notification History" />
      <div className="page-content">
        <div className="card">
          <div className="card-body">
            <Table data={data} columns={columns} pagination={true} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushNotificationHistory;
