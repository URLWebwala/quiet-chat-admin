import React, { useEffect, useState } from "react";
import { allGiftApi, deleteGift } from "../../store/giftSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import TrashIcon from "../../assets/images/delete.svg";
import EditIcon from "../../assets/images/edit.svg";
import { useSelector } from "react-redux";
import { openDialog } from "@/store/dialogSlice";
import Image from "next/image";
import {  warning } from "@/utils/Alert";
import { Menu, MenuItem } from "@mui/material";
import { baseURL } from "@/utils/config";
import Button from "@/extra/Button";
import image from "@/assets/images/bannerImage.png";
import emoji from "@/assets/images/emoji.jpeg";
import CommonDialog from "@/utils/CommonDialog";
import { isSkeleton } from "@/utils/allSelector";


export default function GiftShow() {
  const dispatch = useAppDispatch();
  const { allGift } = useSelector((state: RootStore) => state.gift);
  
  const roleSkeleton = useSelector(isSkeleton);
  const [search, setSearch] = useState<string | undefined>();
  const [data, setData] = useState<any>([]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    dispatch(allGiftApi());
  }, [dispatch]);

  useEffect(() => {
    setData(allGift);
  }, [allGift]);

  const handleDeleteGift = (item: any) => {
    const data = warning("Confirm");
    data
      .then((res) => {
        const yes = res.isConfirmed
        if (yes) {
          const payload: any = {
            giftId: item?._id,
          };
          dispatch(deleteGift(payload));
        }
      })
      .catch((err) => console.log(err));
  };

  const handleDelete = (id: any) => {

    setSelectedId(id);
    setShowDialog(true);
  };

  const confirmDelete = async () => {
    if (selectedId) {
      const payload: any = {
        giftId: selectedId
      }
      dispatch(deleteGift(payload));
      setShowDialog(false);
    }
  };


  const handleOpenModel = (type: any) => {
    if (type === "svga") {
      dispatch(openDialog({ type: "svgaGift" }));
    } else {
      dispatch(openDialog({ type: "imageGift" }));
    }
    setAnchorEl(null);
  };

  const handleEditGift = (item: any, giftData: any) => {

    const giftSend = {
      giftAll: item,
      giftData: giftData,
    };
    const payload: any = {
      type: item?.type === 3 ? "svgaGift" : "imageGift",
      data: giftSend,
    };

    dispatch(openDialog(payload));
  };
  return (
    <div className="giftCategoryShow">
      <div className="row">
        <div className="col-12 col-lg-6 col-md-6 col-sm-12 gifttext fw-600"
          style={{ color: "#404040" , marginBottom:"0px"   }}
        >
          {/* Gift */}
        </div>
        <div className="col-6 new-fake-btn d-flex justify-content-end align-items-center" style={{marginBottom:"0px"}}>
          <div className="dashboardHeader primeHeader p-0"></div>

          <div className="betBox">
            <Button
              className={`bg-button p-10 text-white m10-bottom `}
              bIcon={image}
              text="Add Gift"
              onClick={handleClick}
            />
          </div>
          <Menu
            id="demo-customized-menu"
            MenuListProps={{
              "aria-labelledby": "demo-customized-button",
            }}
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            <MenuItem onClick={() => handleOpenModel("svga")} disableRipple>
              SVGA
            </MenuItem>
            <MenuItem
              onClick={() => handleOpenModel("imageGift")}
              disableRipple
            >
              Image,GIF
            </MenuItem>
          </Menu>
        </div>
      </div>
      <div className="giftCategoryBox">
        <CommonDialog
          open={showDialog}
          onCancel={() => setShowDialog(false)}
          onConfirm={confirmDelete}
          text={"Delete"}
        />

        <div className="row">
          {roleSkeleton ? (
            // 🔄 Skeleton Cards
            Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="col-12 col-sm-12 col-md-6 col-lg-4 col-xl-3 col-xxl-3 mb-4"
              >
                <div
                  className="p-4 text-center"
                  style={{
                    backgroundColor: "#f9f9ff",
                    borderRadius: "16px",
                    width: "100%",
                  }}
                >
                  {/* Circular Image */}
                  <div
                    className="skeleton mx-auto mb-3"
                    style={{
                      height: "100px",
                      width: "100px",
                      borderRadius: "50%",
                    }}
                  ></div>

                  {/* Coin Label */}
                  <div
                    className="skeleton mx-auto mb-3"
                    style={{
                      height: "20px",
                      width: "80px",
                      borderRadius: "4px",
                    }}
                  ></div>

                  {/* Action Buttons */}
                  <div className="d-flex justify-content-center gap-2">
                    {[1, 2].map((_, btnIndex) => (
                      <div
                        key={btnIndex}
                        className="skeleton"
                        style={{
                          height: "32px",
                          width: "32px",
                          borderRadius: "8px",
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : data?.length > 0 ? (
            // ✅ Actual Data Rendering
            data.map((category: any, categoryIndex: number) => {
              if (!category?.gifts?.length) return null;
              return (
                <div key={category._id} className="col-12">
                  <h4 style={{ marginBottom: "10px" , display:"flex" , justifyContent:"start" , fontWeight:"500" }}>
                    {category.categoryName ||
                      (category?.gifts?.[0]?.giftCategory?.name ?? "")}
                  </h4>
                  <div className="row">
                    {category.gifts.map((item: any, index: number) => (
                      <div
                        key={item._id}
                        className="col-12 col-sm-12 col-md-6 col-lg-4 col-xl-3 col-xxl-3"
                        style={{ marginBottom: "0px" }}
                      >
                        <div className="giftCategory">
                          <div className="giftCategory-img">
                            <img
                              src={
                                baseURL +
                                (item.type === 3
                                  ? item.svgaImage?.replace(/\\/g, "/")
                                  : item.image?.replace(/\\/g, "/"))
                              }
                              className="img-gift"
                              width={50}
                              height={50}
                              alt="Image"
                              style={{
                                objectFit: "cover",
                                padding: "0px",
                              }}
                              onError={(e: any) => {
                                e.target.error = null;
                                e.target.src = emoji.src;
                              }}
                            />
                            <h5 style={{ margin: "20px 0px" , fontWeight:"400" }}>
                              {item?.coin + " Coin"}
                            </h5>
                            <div className="action-button">
                              <button
                                className="me-2"
                                style={{
                                  backgroundColor: "#CFF3FF",
                                  borderRadius: "8px",
                                  padding: "8px",
                                }}
                                onClick={() => handleEditGift(item, category)}
                              >
                                <img
                                  src={EditIcon.src}
                                  alt="Edit Icon"
                                  width={22}
                                  height={22}
                                />
                              </button>
                              <button
                                style={{
                                  backgroundColor: "#FFE7E7",
                                  borderRadius: "8px",
                                  padding: "8px",
                                }}
                                onClick={() => handleDelete(item?._id)}
                              >
                                <img
                                  src={TrashIcon.src}
                                  alt="Trash Icon"
                                  width={22}
                                  height={22}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // ❌ No Data Fallback
            <div
              className="d-flex justify-content-center align-items-center text-center"
              style={{ minHeight: "60vh", fontSize: "16px" }}
            >
              No Data Found
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
