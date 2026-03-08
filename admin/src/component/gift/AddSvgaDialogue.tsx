"use-client";

import React, { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import { closeDialog } from "../../store/dialogSlice";
import { useSelector } from "react-redux";
import { ExInput } from "../../extra/Input";
import Button from "../../extra/Button";
import { addGift, updateGift, allGiftCategory } from "../../store/giftSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { baseURL } from "@/utils/config";

const style: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  backgroundColor: "background.paper",
  borderRadius: "13px",
  border: "1px solid #C9C9C9",
  boxShadow: "24px",
  padding: "19px",
};

interface ErrorState {
  image: String;
  giftCategory: String;
  coin: String;
}

const AddSvgaDialogue = () => {
  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );
 
  const { alGiftCategory } = useSelector((state: RootStore) => state.gift);

  const dispatch = useAppDispatch();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [mongoId, setMongoId] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [name, setName] = useState<string>("");
  const [isSubmit, setIsSubmit] = useState<boolean>(true);
  const [coin, setCoin] = useState<string>("");
  const [images, setImages] = useState<any>([]);
  const [imageData, setImageData] = useState<any>(null);
  const [imagePath, setImagePath] = useState<any>(null);
  const [giftCategoryName, setGiftCategoryId] = useState("");

  const [isSvga, setIsSvga] = useState<any>(false);
  const [error, setError] = useState<ErrorState>({
    image: "",
    giftCategory: "",
    coin: "",
  });

  useEffect(() => {
    dispatch(allGiftCategory());
  }, [dispatch]);

  useEffect(() => {
    if (!dialogueData) {
      setIsSubmit(true);
      setIsSvga(false);
    }
  }, []);

  useEffect(() => {
    if (dialogueData) {
      setMongoId(dialogueData?.giftAll?._id);
      setName(dialogueData?.giftAll?.name);
      setCoin(dialogueData?.giftAll?.coin);
      setGiftCategoryId(dialogueData?.giftData?._id);
      setImagePath(baseURL + dialogueData?.giftAll?.image);
      if (dialogueData?.giftAll?.image?.split(".")?.pop() === "svga") {
        setIsSvga(true);
      }
    }
    setAddCategoryOpen(dialogue);
  }, [dialogue, dialogueData]);

  useEffect(() => {
    const loadSvgaPlayerWeb = async () => {
      const { Player, Parser } = await import("svgaplayerweb");
      if (isSvga) {
        const parser = new Parser();
        const element: any = document.getElementById("svga");

        if (element && imagePath) {
          const player = new Player(element); // Change this to directly use the element, not querySelector

          if (imageData?.preview) {
            parser.load(imageData?.preview, function (videoItem) {
              player.setVideoItem(videoItem);
              player.startAnimation();
              setTimeout(() => {
                captureAndSendImage(player, mongoId);
              }, 3000);
            });
          } else {
            parser.load(
              baseURL + dialogueData?.giftAll?.image,
              function (videoItem) {
                // Ensure correct path
                player.setVideoItem(videoItem);
                player.startAnimation(); // Ensure animation is started
                setTimeout(() => {
                  captureAndSendImage(player, mongoId);
                }, 3000);
              }
            );
          }
        }
      } else {
        setIsSubmit(false);
      }
    };

    if (typeof window !== "undefined") {
      loadSvgaPlayerWeb();
    }
  }, [imageData, isSvga, imagePath, dialogueData]);

  const captureAndSendImage = (player: any, mongoId: any) => {
    return new Promise((resolve) => {
      player.pauseAnimation();
      const canvasElement = document.querySelector(
        `div[id="svga"] canvas`
      ) as HTMLElement;
      if (!canvasElement) {
        return;
      }
      html2canvas(canvasElement, {
        scale: 1,
        useCORS: true,
        backgroundColor: "rgba(0, 0, 0, 0)",
        onclone: (cloneDoc) => {
          const clonedCanvas = cloneDoc.querySelector(
            `div[id="svga"] canvas`
          ) as HTMLElement;
          if (clonedCanvas) {
            clonedCanvas.style.backgroundColor = "transparent";
          }
        },
      }).then((canvas) => {
        const data = canvas.toDataURL("image/png");
        canvas.toBlob((blob: any) => {
          resolve(blob);
          setImage(blob);
          setIsSubmit(false);
        }, "image/png");
      });
    });
  };

  const handleInputImage = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setImage(null);
    setIsSubmit(true);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      });
      setImageData(file);
      setImages([file]);

      const reader = new FileReader();

      reader.addEventListener("load", () => {
        if (reader.result) {
          setImagePath(reader.result.toString());
        }
        setError({
          ...error,
          image: "",
        });
      });

      reader.readAsDataURL(file);

      if (file.name.split(".").pop() === "svga") {
        setIsSvga(true);
      } else {
        setIsSvga(false);
      }
    }
  };

  const handleSubmit = (e: any) => {

    e.preventDefault();

    let newError: ErrorState = {
      image: "",
      giftCategory: "",
      coin: "",
    };

    if (!coin) newError.coin = "Coin is required";
    if (!image) newError.image = "Image is required";
    if (!giftCategoryName) newError.giftCategory = "Gift Category is required";

    if (!coin || !image || !giftCategoryName) {
      setError(newError);
      return;
    } else {
      let formData = new FormData();
      formData.append("coin", coin);
      formData.append("svgaImage", image);
      formData.append("giftCategoryId", giftCategoryName);

      if (mongoId) {
        formData.append("image", imageData);
      } else {
        for (let i = 0; i < images.length; i++) {
          formData.append("image", images[i]);
        }
      }
      formData.append("type", `${3}`);

      if (mongoId) {
        const payload: any = {
          data: formData,
          giftId: mongoId,
        };
        dispatch(updateGift(payload));
      } else {
        const payload: any = {
          data: formData,
        };
        dispatch(addGift(payload));
      }

      dispatch(closeDialog());
    }
  };

  return (
    <div className="dialog">
      <div className="w-75">
        <div className="row justify-content-center">
          <div className="col-xl-5 col-md-8 col-11">
            <div className="mainDiaogBox">
              <div className="row justify-content-between align-items-center formHead">
                <div className="col-8">
                  <h2 className="text-theme fs-26 m0">Add Svga</h2>
                </div>
                <div className="col-4">
                  <div
                    className="closeButton fs-18"
                    onClick={() => {
                      dispatch(closeDialog());
                    }}
                  >
                    ✖
                  </div>
                </div>
              </div>

              <form>
                <div
                  className="row sound-add-box"
                  style={{ overflowX: "hidden" }}
                >
                  <div className="col-12">
                    <div className="inputData">
                      <label className="  " htmlFor="category">
                        Category
                      </label>
                      <select
                        name="category"
                        className="rounded-2"
                        id="category"
                        value={giftCategoryName}
                        onChange={(e) => {
                          setGiftCategoryId(e.target.value);
                          setError((prev) => ({
                            ...prev,
                            giftCategory: e.target.value
                              ? ""
                              : "Gift Category is required",
                          }));
                        }}
                      >
                        <option value="" disabled>
                          --Select Category--
                        </option>
                        {alGiftCategory?.map((data) => (
                          <option key={data._id} value={data._id}>
                            {data.name}
                          </option>
                        ))}
                      </select>

                      {error?.giftCategory && (
                        <p className="errorMessage text-start">
                          {error && error?.giftCategory}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-12 mt-2">
                    <ExInput
                      label={"Coin"}
                      name={"coin"}
                      placeholder={"Enter Coin"}
                      value={coin}
                      type={"number"}
                      errorMessage={error.coin && error.coin}
                      onChange={(e: any) => {
                        setCoin(e.target.value);
                        if (!e.target.value) {
                          setError({
                            ...error,
                            coin: "Coin Is Required",
                          });
                        } else {
                          setError({
                            ...error,
                            coin: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-12 mt-2">
                    <ExInput
                      type={"file"}
                      label={"Gift Image"}
                      accept={".svga, .gift"}
                      errorMessage={error.image && error.image}
                      onChange={handleInputImage}
                    />
                    <span className="text-danger" style={{ fontSize: "12px" }}>
                     Gift Image (Accepted formats: svga , gift)
                    </span>
                  </div>
                  <div className="col-12 d-flex justify-content-center">
                    <div className="row">
                      {imagePath && (
                        <>
                          {!isSvga ? (
                            <img
                              src={imagePath}
                              className="mt-3 rounded float-left mb-2"
                              height="100px"
                              width="100px"
                            />
                          ) : (
                            <>
                              <div
                                id="svga"
                                style={{
                                  boxShadow:
                                    "0 5px 15px 0 rgb(105 103 103 / 00%)",
                                  float: "left",
                                  objectFit: "contain",
                                  marginRight: 15,
                                  width: "350px",
                                  marginBottom: "10px",
                                  backgroundColor: "transparent",
                                  height: "350px",
                                }}
                              ></div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="mt-3 d-flex justify-content-end"
                  style={{ paddingRight: "0px" }}
                >
                  <Button
                    className={`cancelButton text-light`}
                    text={`Cancel`}
                    type={`button`}
                    onClick={() => dispatch(closeDialog())}
                  />
                  <Button
                    type={`submit`}
                    className={` text-white m10-left submitButton`}
                    disabled={!image ? true : false}
                    btnName={dialogueData ? "Update" : "Submit"}
                    text={`Submit`}
                    // style={{ backgroundColor: "#1ebc1e", opacity: !image ? 0.5 : 1 }}
                    onClick={(e: any) => handleSubmit(e)}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSvgaDialogue;
