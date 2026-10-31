

import blog_img_1 from "@/assets/images/resource/blog-inner1.jpg";
import blog_img_2 from "@/assets/images/resource/blog-inner2.jpg";
import blog_img_3 from "@/assets/images/resource/blog-inner3.jpg";
import { StaticImageData } from "next/image";

interface DataType {
  id: number;
  thumb: StaticImageData;
  view: number;
  comment: number;
  author: string;
  title: string;
  sm_des: string;
}[]

const blog_data: DataType[] =[
  {
    id: 1,
    thumb: blog_img_1,
    view: 155,
    comment: 25,
    author: "Bradley R Grady",
    title: "Addressing Wind Energy Innovation Challenges Solar Supply Chain Finance",
    sm_des: "When to Use Lorem Ipsum generally, lorem ipsum is best suited to keeping templates from looking bare or minimizing the distractions of the draft copy. Second, use lorem ipsum if you think the placeholder text will distracting. For specific projects, a collaboration between copywriters and designers may be best, however, KarecGran When to Use Lorem Ipsum generally, lorem ipsum is best",
  },
  {
    id: 2,
    thumb: blog_img_2,
    view: 305,
    comment: 34,
    author: "Bradley R Grady",
    title: "Addressing Wind Energy Innovation Challenges Solar Supply Chain Finance",
    sm_des: "When to Use Lorem Ipsum generally, lorem ipsum is best suited to keeping templates from looking bare or minimizing the distractions of the draft copy. Second, use lorem ipsum if you think the placeholder text will distracting. For specific projects, a collaboration between copywriters and designers may be best, however, KarecGran When to Use Lorem Ipsum generally, lorem ipsum is best", 
  },
  {
    id: 3,
    thumb: blog_img_3,
    view: 543,
    comment: 44,
    author: "Bradley R Grady",
    title: "Addressing Wind Energy Innovation Challenges Solar Supply Chain Finance",
    sm_des: "When to Use Lorem Ipsum generally, lorem ipsum is best suited to keeping templates from looking bare or minimizing the distractions of the draft copy. Second, use lorem ipsum if you think the placeholder text will distracting. For specific projects, a collaboration between copywriters and designers may be best, however, KarecGran When to Use Lorem Ipsum generally, lorem ipsum is best", 
  },
]
export default blog_data