"use client";

export default function Button({
  onClick,
  text,
  aIcon,
  bIcon,
  className,
  type,
  style,
  title,
}: any) {
  return (
    <>
      <button
        type={type}
        className={`themeButton ${className}`}
        title={title}
        style={style}
        onClick={onClick}
      >
        <div className="d-flex gap-2 align-items-center justify-content-center">
        {bIcon && (
          <span>
            <img
            src={bIcon.src}
            width={22.5}
            height={22.5}
            />
            {/* <i className={`${bIcon} m5-right`}></i> */}
          </span>
        )}
        <span>{text}</span>
        </div>
        {aIcon && (
          <span>
            <i className={`${aIcon} m5-left`}></i>
          </span>
        )}
      </button>
    </>
  );
}
