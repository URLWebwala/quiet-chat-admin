"use-client";

import React, { useEffect, useState } from "react";
import { closeDialog } from "../../store/dialogSlice";
import { useSelector } from "react-redux";
import { ExInput } from "../../extra/Input";
import Button from "../../extra/Button";
import { addGift, updateGift, allGiftCategory } from "../../store/giftSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { baseURL } from "@/utils/config";
import Image from "next/image";

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
interface giftCategoryData {
  _id: string;
  name: string;
  image: string;
  giftCategoryId: string;

}



const CreateGift = () => {
  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );
  const { alGiftCategory } = useSelector((state: RootStore) => state.gift)


  const dispatch = useAppDispatch();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [mongoId, setMongoId] = useState<string>("");
  const [image, setImage] = useState<File | any>(null);
  const [name, setName] = useState<string>("");
  const [coin, setCoin] = useState<string>("");
  const [categoryDataSelect, setCategoryDataSelect] =
  useState<giftCategoryData>();
  const [imagePath, setImagePath] = useState<any>(null);
  const [giftCategoryId, setGiftCategoryId] = useState<any>("");

  const [error, setError] = useState<ErrorState>({
    image: "",
    giftCategory: "",
    coin: "",
  });

  useEffect(() => {
    dispatch(allGiftCategory());
  }, [dispatch]);

  useEffect(() => {
    if (dialogueData) {
      setMongoId(dialogueData?.giftAll?._id);
      setName(dialogueData?.giftAll?.name);
      setCoin(dialogueData?.giftAll?.coin);
      setImagePath(baseURL + dialogueData?.giftAll.image?.replace(/\\/g, "/"));

      setGiftCategoryId(dialogueData?.giftData?._id);

    }
    setAddCategoryOpen(dialogue);
  }, [dialogueData , alGiftCategory]);




  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setImage(file);

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImagePath(reader.result as string);
    });
    reader.readAsDataURL(file);
    setError({ ...error, image: "" });
  };

  const handleSubmit = (e: any) => {

    e.preventDefault();

    let newError: ErrorState = {
      image: "",
      giftCategory: "",
      coin: "",
    };

    if (!coin) newError.coin = "Coin is required";
    if (!imagePath) newError.image = "Image is required";
    if (!giftCategoryId) newError.giftCategory = "Gift Category is required";

    if (!coin || !imagePath || !giftCategoryId) {
      setError(newError);
      return;
    }

    let formData = new FormData();
    formData.append("coin", coin);
    formData.append("image", image);
    formData.append("giftCategoryId", giftCategoryId);
    formData.append("type", image?.type === "image/gif" ? "2" : "1");

    if (mongoId) {
      dispatch(updateGift({ data: formData, giftId: mongoId }));
    } else {
      dispatch(addGift({ data: formData, giftCategoryId  : categoryDataSelect?._id }));
    }

    dispatch(closeDialog());
  };


  return (
    <div className="dialog">
      <div className="w-75">
        <div className="row justify-content-center">
          <div className="col-xl-5 col-md-8 col-11">
            <div className="mainDiaogBox">
              <div className="row justify-content-between align-items-center formHead">
                <div className="col-8">
                  <h2 className="text-theme fs-26 m0">{dialogueData ? "Update Gift" : "Add Gift"}</h2>
                </div>
                <form>
                  <div className="row sound-add-box" style={{ overflowX: "hidden" }}>
                    <div className="col-12">
                      <div className="inputData">
                        <label className="  " htmlFor="category">
                          Category
                        </label>
                        <select
                          name="category"
                          className="rounded-2"
                          id="category"
                          value={giftCategoryId}
                          onChange={(e) => {
                            setGiftCategoryId(e.target.value);
                            setError((prev) => ({ ...prev, giftCategory: e.target.value ? "" : "Gift Category is required" }));
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
                        placeholder={"Enter Coin..."}
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
                        label={"Gift Image Or GIF Image "}
                        accept={"image/png, image/jpeg,image/gif,image/webp"}
                        errorMessage={error.image && error.image}
                        onChange={handleFileUpload}
                      />
                      <span className="text-danger" style={{ fontSize: "12px" }}>
                     Gift Image Or GIF Image (Accepted Format : png , jpeg , gif , webp)
                    </span>
                    </div>
                    <div className="col-6 d-flex justify-content-start">
                      {imagePath && (
                        <img
                          src={imagePath}
                          className=""
                          height={100}
                          width={100}
                          alt="Image"
                          style={{ objectFit: 'contain', borderRadius: "10px " }}
                        />
                      )}

                    </div>

                    <div className="mt-3 d-flex justify-content-end">
                      <Button
                        className={`cancelButton text-light`}
                        text={`Cancel`}
                        type={`button`}
                        onClick={() => dispatch(closeDialog())}
                      />
                      <Button
                        type={`submit`}
                        className={` text-white m10-left submitButton`}
                        btnName={dialogueData ? "Update" : "Submit"}
                        text={`Submit`}
                        // style={{ backgroundColor: "#1ebc1e" }}
                        onClick={(e: any) => handleSubmit(e)}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGift;
