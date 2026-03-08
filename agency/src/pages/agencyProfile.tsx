import React, { ChangeEvent, useEffect, useState } from "react";
import RootLayout from "../component/layout/Layout";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { ExInput, Textarea } from "@/extra/Input";
import { useSelector } from "react-redux";
import { isLoading, isSkeleton } from "@/utils/allSelector";
import { RootStore, useAppDispatch } from "@/store/store";
import { useRouter } from "next/router";
import { baseURL, key } from "@/utils/config";
import male from "@/assets/images/male.png";
import { agencyProfileGet, agencyProfileUpdate } from "@/store/adminSlice";
import Button from "@/extra/Button";
import ReactSelect from "react-select";
import countriesData from "@/api/countries.json";
import { auth } from "@/component/lib/firebaseConfig";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import coin from "@/assets/images/coin.png";

const agencyProfile = () => {
  const { admin, user } = useSelector((state: any) => state.admin);
  const { setting }: any = useSelector((state: RootStore) => state?.setting);
  console.log("setting", setting);

  const loader = useSelector(isLoading);
  const roleSkeleton = useSelector(isSkeleton);
  const router = useRouter();
  const id: any = router?.query?.id;
  const [loadingCountries, setLoadingCountries] = useState(false);

  const updatedImagePath = admin?.image?.replace(/\\/g, "/");
  const dispatch = useAppDispatch();

  const [countryOptions, setCountryOptions] = useState<any[]>([]); // All countries
  const [selectedCountry, setSelectedCountry] = useState<any>(null); // Selected country

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [commission, setCommission] = useState("");
  const [countryCode, setCountryCode] = useState<any>("");
  const [description, setDescription] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const { countryData } = useSelector((state: any) => state.admin);
  const [countryDataSelect, setCountryDataSelect] = useState<any>({});
  const [agencyCode, setAgencyCode] = useState("");
  const [hostCoin, setHostCoin] = useState("");
  const [totalEarning, setTotalEarning] = useState("");
  const [netAvailableEarnings, setNetAvailableEarnings] = useState("");
  const [totalWithdraw, setTotalWithdraw] = useState("");
  const [totalWithdrawAmount, setTotalWithdrawAmount] = useState("");
  const [isBlock, setIsBlock] = useState("");
  const [image, setImage] = useState<File | undefined>();
  const [imagePath, setImagePath] = useState<any>();
  const [error, setError] = useState({
    name: "",
    countryCode: "",
    mobileNumber: "",
    email: "",
    password: "",
    commission: "",
    country: "",
    description: "",
    image: "",
    imagePath: "",
  });

  useEffect(() => {
    if (!id) return;
    dispatch(agencyProfileGet());
  }, [dispatch, id]);

  useEffect(() => {
    setName(admin?.name);
    setEmail(admin?.email);
    setPassword(admin?.password);
    setCommission(admin?.commission);
    setCountryCode(admin?.countryCode);
    setDescription(admin?.description);
    setMobileNumber(admin?.mobileNumber);
    setAgencyCode(admin?.agencyCode);
    setHostCoin(admin?.hostCoins?.toFixed(2));
    setTotalEarning(admin?.totalEarnings?.toFixed(2));
    setTotalWithdraw(admin?.totalWithdrawn?.toFixed(2));
    setTotalWithdrawAmount(admin?.totalWithdrawnAmount?.toFixed(2));
    setNetAvailableEarnings(admin?.netAvailableEarnings?.toFixed(2));
    setIsBlock(admin?.isBlock);
    if (updatedImagePath) {
      setImagePath(baseURL + updatedImagePath);
    }
  }, [admin]);

  const handleUploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
      setImagePath(URL.createObjectURL(event.target.files[0]));
      setError((prevErrors) => ({ ...prevErrors, image: "" }));
    }
  };

  useEffect(() => {
    const processCountries = () => {
      setLoadingCountries(true);

      try {
        // Transform countries to React Select format
        const transformedCountries = countriesData
          .filter(
            (country) =>
              country.name?.common && country.cca2 && country.flags?.png
          )
          .map((country) => ({
            value: country.cca2, // Required by React Select
            label: country.name.common, // Required by React Select
            name: country.name.common,
            code: country.cca2,
            flagUrl: country.flags.png || country.flags.svg,
            flag: country.flags.png || country.flags.svg, // For compatibility
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setCountryOptions(transformedCountries);

        // Set default or existing country
        if (admin?.country) {
          const existingCountry = transformedCountries.find(
            (c: any) => c.name.toLowerCase() === admin.country.toLowerCase()
          );
          setSelectedCountry(existingCountry || null);
        } else {
          // Set India as default
          const defaultCountry = transformedCountries.find(
            (c: any) => c.name === "India"
          );
          setSelectedCountry(defaultCountry || transformedCountries[0] || null);
        }
      } catch (error) {
        console.error("Failed to process countries:", error);
      } finally {
        setLoadingCountries(false);
      }
    };

    processCountries();
  }, [admin]);

  useEffect(() => {
    const iframeData = document.getElementById("iframeId");

    if (iframeData) {
      // iframeData.src = `https://maps.google.com/maps?q=${doctorProfile?.locationCoordinates?.latitude},${doctorProfile?.locationCoordinates?.longitude}&hl=es;&output=embed`;
    }
  }, []);

 

  const handlePrevious = (url: any) => {
    window.open(url, "_blank");
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    let error = {} as any;
    if (!name) error.name = "Name is Required!";
    if (!email) error.email = "Email is Required!";
    if (!email?.includes("@")) error.email = "Email must include '@'";
    if (!image && !imagePath) {
      error.image = "Image is required";
    }
    if (!commission) error.commission = "Commission is Required!";
    if (!password) error.password = "Password is Required!"; // only required for create
    if (!mobileNumber) error.mobileNumber = "Mobile Number is Required!";
    if (!description) error.description = "Description is Required!";
    if (!countryCode) error.countryCode = "CountryCode is Required!";
    if (countryCode <= 0)
      error.countryCode = "CountryCode can not less than or equal to 0";

    if (Object.keys(error).length > 0) {
      return setError(error);
    }

    try {
      const updatedFields: any = {};

      if (name !== admin.name) updatedFields.name = name;
      if (email !== admin.email) updatedFields.email = email;
      if (image && image instanceof File) {
        updatedFields.image = image;
      }
      if (commission !== admin.commission)
        updatedFields.commission = commission;
      if (password !== admin.password) updatedFields.password = password;
      if (mobileNumber !== admin.mobileNumber)
        updatedFields.mobileNumber = mobileNumber;
      if (description !== admin.description)
        updatedFields.description = description;
      if (countryDataSelect?.name?.common !== admin.country)
        updatedFields.country = selectedCountry?.name;

      if (countryDataSelect?.flags?.png !== admin.countryFlagImage)
        updatedFields.countryFlagImage = selectedCountry!.flag;

      // Create FormData
      const formData = new FormData();
      for (const key in updatedFields) {
        if (updatedFields[key] !== undefined && updatedFields[key] !== null) {
          formData.append(key, updatedFields[key]);
        }
      }

      if (updatedFields?.email) {
        const user: any = auth?.currentUser;
        const credential = EmailAuthProvider.credential(
          user.email,
          admin.password
        );
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, updatedFields.email);
      }

      if (updatedFields?.password) {
        const user: any = auth?.currentUser;
        const credential = EmailAuthProvider.credential(
          user.email,
          admin.password
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, updatedFields.password);
      }

      const payload = {
        agencyId: admin?._id,
        data: formData,
      };

      dispatch(agencyProfileUpdate(payload));
    } catch (error: any) {
      console.error("Error in handleSubmit:", error.message);
    }
  };

  const handleSelectChange = (selected: any | null) => {
    setSelectedCountry(selected);

    if (!selected) {
      return setError({
        ...error,
        country: `Country Is Required`,
      });
    } else {
      return setError({
        ...error,
        country: "",
      });
    }
  };

  const CustomOption = ({ innerRef, innerProps, data }: any) => (
    <div
      ref={innerRef}
      {...innerProps}
      className="optionShow-option p-2 d-flex align-items-center"
    >
      <img
        height={24}
        width={32}
        alt={data.name}
        src={data.flagUrl}
        className="me-2"
        style={{ objectFit: "cover" }}
      />
      <span>{data.label}</span>
    </div>
  );

  return (
    <>
      <div className="p-3">
        <div
          className="text-capitalized fw-400 text"
          style={{ color: "#838383", fontSize: "20px" }}
        >
          {`${admin?.name ? name : " "}'s   Profile`}
        </div>
        <div className="card mt-3">
          <div className="card-body">
            <div className="row" style={{ padding: "20px" }}>
              <div
                className="col-lg-3 col-md-6 col-12"
                style={{
                  height: "250px",
                }}
              >
                {roleSkeleton === true ? (
                  <>
                    <SkeletonTheme baseColor="#e2e5e7" highlightColor="#fff">
                      <p className="d-flex justify-content-center ">
                        <Skeleton
                          height={260}
                          width={240}
                          style={{
                            height: "380px",
                            width: "380px",
                            objectFit: "cover",
                            boxSizing: "border-box",
                            borderRadius: "30px",
                          }}
                        />
                      </p>
                    </SkeletonTheme>
                  </>
                ) : (
                  <div className="card-body">
                    <div className="position-relative">
                      <input
                        id="file-input"
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={(e) => handleUploadImage(e)}
                      />
                      <img
                        // src={
                        //   admin?.image ? baseURL + updatedImagePath : male.src
                        // }
                        src={imagePath ? imagePath : male.src}
                        className="img-fluid"
                        width={240}
                        height={260}
                        style={{
                          height: "260px",

                          width: "260px",
                          objectFit: "contain",
                          boxSizing: "border-box",
                          borderRadius: "20px",
                        }}
                        onError={(e: any) => {
                          const target = e.currentTarget;
                          target.onerror = null; // Prevent infinite loop
                          target.src = male.src;
                        }}
                        onClick={() => handlePrevious(imagePath)}
                        alt=""
                      />
                      <div
                        className="position-absolute"
                        style={{ top: "4%", right: "10%" }}
                      >
                        <div
                          className="bg-theme"
                          style={{
                            // background: "rgb(31, 28, 48)",
                            borderRadius: 50,
                            height: 29,
                          }}
                        >
                          <label htmlFor="file-input">
                            <i
                              className="fa fa-camera d-flex justify-content-center  rounded-circle  p-2 cursorPointer m-0"
                              style={{
                                fontSize: 14,
                                color: "rgb(255, 255, 255)",
                                cursor: "pointer",
                                marginRight: "3px",
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-lg-9 col-md-6 col-12">
                <div className="row">
                  <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`name`}
                        name={`name`}
                        value={name}
                        label={`Name`}
                        placeholder={`Name`}
                        errorMessage={error && error.name}
                        onChange={(e: any) => {
                          setName(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              name: "name is Required !",
                            });
                          } else {
                            setError({
                              ...error,
                              name: "",
                            });
                          }
                        }}
                      />
                    )}
                  </div>

                  <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`agencyCode`}
                        name={`agencyCode`}
                        value={agencyCode}
                        label={`Agency Code`}
                        placeholder={`Agency Code`}
                        readOnly
                      />
                    )}
                  </div>

                  <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`emailId`}
                        name={`emailId`}
                        value={email}
                        label={`Email`}
                        placeholder={`Email`}
                        errorMessage={error && error.email}
                        onChange={(e: any) => {
                          setEmail(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              email: "email is Required !",
                            });
                          } else {
                            setError({
                              ...error,
                              email: "",
                            });
                          }
                        }}
                      />
                    )}
                  </div>
                  <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`countryCode`}
                        type="number"
                        name={`countryCode`}
                        value={countryCode}
                        errorMessage={error && error.countryCode}
                        label={`Country Code`}
                        placeholder={`Country Code`}
                        onChange={(e: any) => {
                          setCountryCode(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              countryCode: "countryCode is Required !",
                            });
                          } else {
                            setError({
                              ...error,
                              countryCode: "",
                            });
                          }
                        }}
                      />
                    )}
                  </div>

                  <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`mobileNumber`}
                        type="number"
                        name={`mobileNumber`}
                        value={mobileNumber}
                        errorMessage={error && error.mobileNumber}
                        label={`Mobile Number`}
                        placeholder={`Mobile Number`}
                        onChange={(e: any) => {
                          setMobileNumber(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              mobileNumber: "mobileNumber is Required !",
                            });
                          } else {
                            setError({
                              ...error,
                              mobileNumber: "",
                            });
                          }
                        }}
                      />
                    )}
                  </div>

                  <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`password`}
                        name={`password`}
                        value={password}
                        label={`Password`}
                        placeholder={`Password`}
                        errorMessage={error && error.password}
                        onChange={(e: any) => {
                          setPassword(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              password: "password is Required !",
                            });
                          } else {
                            setError({
                              ...error,
                              password: "",
                            });
                          }
                        }}
                      />
                    )}
                  </div>

                  <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <div className="mt-1">
                        <ExInput
                          id={`commission`}
                          name={`commission`}
                          value={commission}
                          label={`Commission (%)`}
                          placeholder={`Commission`}
                          errorMessage={error && error.commission}
                          onChange={(e: any) => {
                            setCommission(e.target.value);
                            if (!e.target.value) {
                              return setError({
                                ...error,
                                commission: "commission is Required !",
                              });
                            } else {
                              setError({
                                ...error,
                                commission: "",
                              });
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <div className="col-12 col-sm-12 col-md-12 col-lg-12 col-lg-12">
                        <div className="custom-input">
                          <div className="inputData">
                            <label className="">Country</label>
                          </div>
                          <ReactSelect
                            options={countryOptions} // FIXED: Use options array
                            value={selectedCountry} // FIXED: Use selected country
                            isClearable={true}
                            isLoading={loadingCountries}
                            placeholder="Select a country..."
                            onChange={handleSelectChange}
                            className="mt-2"
                            classNamePrefix="react-select"
                            formatOptionLabel={(option) => (
                              console.log("option: ", option),
                              (
                                <div className="d-flex align-items-center">
                                  <img
                                    height={20}
                                    width={28}
                                    alt={option.name}
                                    src={option.flagUrl}
                                    className="me-2"
                                    style={{ objectFit: "cover" }}
                                    onError={(e: any) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                  <span>{option.label}</span>
                                </div>
                              )
                            )}
                            components={{
                              Option: CustomOption,
                            }}
                            styles={{
                              option: (provided, state) => ({
                                ...provided,
                                cursor: "pointer",
                                "&:hover": {
                                  backgroundColor: "#f8f9fa",
                                },
                              }),
                            }}
                          />
                          {<p>{error.country}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`hostCoin`}
                        name={`hostCoin`}
                        value={hostCoin}
                        // label={`Host Coin`}
                        label={
                          <span>
                            Host Coin{" "}
                            <img
                              src={coin.src} // or import coin from '@/assets/coin.png' and use coin.src
                              alt="coin"
                              style={{
                                width: 20,
                                height: 20,
                                verticalAlign: "middle",
                              }}
                            />
                          </span>
                        }
                        placeholder={`Host Coin`}
                        readOnly
                      />
                    )}
                  </div> */}

                  {/* <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`totalEarning`}
                        name={`totalEarning`}
                        value={totalEarning || 0}
                        // label={`Total Earning`}
                        label={
                          <span>
                            Total Earning{" "}
                            <img
                              src={coin.src} // or import coin from '@/assets/coin.png' and use coin.src
                              alt="coin"
                              style={{
                                width: 20,
                                height: 20,
                                verticalAlign: "middle",
                              }}
                            />
                          </span>
                        }
                        placeholder={`Total Earning`}
                        readOnly
                      />
                    )}
                  </div> */}

                  {/* <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`netAvailableEarnings`}
                        name={`netAvailableEarnings`}
                        value={netAvailableEarnings || 0}
                        // label={`Net Available Earnings`}
                        label={
                          <span>
                            Net Available Earnings{" "}
                            <img
                              src={coin.src} // or import coin from '@/assets/coin.png' and use coin.src
                              alt="coin"
                              style={{
                                width: 20,
                                height: 20,
                                verticalAlign: "middle",
                              }}
                            />
                          </span>
                        }
                        placeholder={`Net Available Earnings`}
                        readOnly
                      />
                    )}
                  </div> */}

                  {/* <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`totalWithdraw`}
                        name={`totalWithdraw`}
                        value={totalWithdraw}
                        label={`Total Withdraw `}
                        placeholder={`Total Withdraw`}
                        readOnly
                      />
                    )}
                  </div> */}

                  {/* <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`totalWithdrawamount`}
                        name={`totalWithdrawamount`}
                        value={totalWithdrawAmount || 0}
                        label={`Total Withdraw Amount`}
                        placeholder={`Total Withdraw Amount`}
                        readOnly
                      />
                    )}
                  </div> */}

                  {/* <div className="col-md-12 col-lg-6 col-xl-4">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={40}
                              width={250}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <ExInput
                        id={`isBlock`}
                        name={`isBlock`}
                        value={isBlock ? "Yes" : "No"}
                        label={`Is Block`}
                        placeholder={`Is Block`}
                        readOnly
                      />
                    )}
                  </div> */}
                </div>

                <div className="row">
                  <div className="col-12">
                    {roleSkeleton === true ? (
                      <>
                        <SkeletonTheme
                          baseColor="#e2e5e7"
                          highlightColor="#fff"
                        >
                          <p className="d-flex justify-content-center my-3">
                            <Skeleton
                              height={150}
                              width={850}
                              style={{
                                borderRadius: "10px",
                              }}
                            />
                          </p>
                        </SkeletonTheme>
                      </>
                    ) : (
                      <>
                        <div className="inputData number  flex-row justify-content-start text-start">
                          <label>Description</label>
                        </div>
                        <Textarea
                          row={5}
                          value={description}
                          errorMessage={error && error.description}
                          onChange={(e: any) => {
                            setDescription(e.target.value);
                            if (!e.target.value) {
                              return setError({
                                ...error,
                                description: `Description is required`,
                              });
                            } else {
                              return setError({
                                ...error,
                                description: "",
                              });
                            }
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="d-flex justify-content-end">
                  <Button
                    type={`submit`}
                    className={` text-white m10-left`}
                    style={{ backgroundColor: "#9f5aff" }}
                    text={`Submit`}
                    onClick={(e: any) => handleSubmit(e)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
agencyProfile.getLayout = function getLayout(page: React.ReactNode) {
  return <RootLayout>{page}</RootLayout>;
};

export default agencyProfile;
