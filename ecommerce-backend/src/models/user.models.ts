import mongoose from "mongoose";
import validator from "validator";

export interface Iuser {
  _id: string;
  name: string;
  email: string;
  photo: string;
  role: "admin" | "user";
  gender: "male" | "female";
  dob: Date;
  createdAt: Date;
  updatedAt: Date;
  age: number;
}

const schema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: [true, "User ID is required"],
    },
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      unique: [true, "Email already exists"],
      required: [true, "Please enter your email"],
      validate: validator.default.isEmail,
    },
    photo: {
      type: String,
      required: [true, "Photo is required"],
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Please enter your gender"],
    },
    dob: {
      type: Date,
      required: [true, "Please enter your date of birth"],
    },
  },
  {
    timestamps: true,
  }
);

schema.virtual("age").get(function () {
  const today = new Date();
  const dob = this.dob;
  let age = today.getFullYear() - dob.getFullYear();

  if (today.getMonth() < dob.getMonth()) {
    age--;
  } else if (today.getMonth() === dob.getMonth()) {
    if (today.getDate() < dob.getDate()) {
      age--;
    }
  }
  return age;
});

export const User = mongoose.model<Iuser>("User", schema);
