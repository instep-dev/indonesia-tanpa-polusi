import React from 'react'

const Button = ({
  children,
  Icon,
  onClick,
  variant = "primary",
}: {
  children: string
  Icon?: React.ComponentType,
  onClick?: ()=> void,
  variant?: string
}) => {

  const variantClass =
    variant === "primary" ? "asdad" :
    variant === "white" ? "asdasdadasd" :
    variant === "black" ? "asdadsadadad" : ""

  return (
    <button type="button" onClick={onClick} className={`${variantClass}`}>
      <p>{children}</p>
      {Icon && <Icon />}
    </button>
  )
}

export default Button