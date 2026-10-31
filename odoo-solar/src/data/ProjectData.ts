import project_img_1 from "@/assets/images/project/project1.png";
import project_img_2 from "@/assets/images/project/project2.png";
import project_img_3 from "@/assets/images/project/project3.png";
import project_img_4 from "@/assets/images/project/project4.png";
import project_img_5 from "@/assets/images/project/project5.png";
import project_img_6 from "@/assets/images/project/project6.png";
import { StaticImageData } from "next/image";


interface DataType {
  id: number;
  img: StaticImageData;
  name: string;
  title: string;
  category: string;
}


const project_data:DataType[] = [
	{
		id: 1,
		img: project_img_1,
		name: "Chain Finance Program",
		title: "ECO, Supply Chain",
		category: "Business",
	},
  {
		id: 2,
		img: project_img_2,
		name: "New Public Attitude Tracker",
		title: "Digital Product",
		category: "Energy",
	},
  {
		id: 3,
		img: project_img_3,
		name: "Smarter Ways to Manage",
		title: "ECO, Supply Chain",
		category: "Finance",
	},
  {
		id: 4,
		img: project_img_4,
		name: "Task Managemen",
		title: "Creative Work",
		category: "Supply Chain",
	},
  {
		id: 5,
		img: project_img_5,
		name: "Addressing Wind Energy",
		title: "ECO, Supply Chain",
		category: "Business",
	},
  {
		id: 6,
		img: project_img_6,
		name: "Historical Book Design",
		title: "Finance, Supply",
		category: "Energy",
	},
  // update
  {
		id: 1,
		img: project_img_4,
		name: "Chain Finance Program",
		title: "ECO, Supply Chain",
		category: "Business",
	},
  {
		id: 2,
		img: project_img_5,
		name: "New Public Attitude Tracker",
		title: "Digital Product",
		category: "Supply Chain",
	},
  {
		id: 3,
		img: project_img_6,
		name: "Smarter Ways to Manage",
		title: "ECO, Supply Chain",
		category: "Finance",
	},
  {
		id: 4,
		img: project_img_1,
		name: "Task Managemen",
		title: "Creative Work",
		category: "Supply Chain",
	},
  {
		id: 5,
		img: project_img_2,
		name: "Addressing Wind Energy",
		title: "ECO, Supply Chain",
		category: "Business",
	},
  {
		id: 6,
		img: project_img_3,
		name: "Historical Book Design",
		title: "Finance, Supply",
		category: "Energy",
	},
  // update
  {
		id: 3,
		img: project_img_6,
		name: "Smarter Ways to Manage",
		title: "ECO, Supply Chain",
		category: "Supply Chain",
	},
  {
		id: 4,
		img: project_img_1,
		name: "Task Managemen",
		title: "Creative Work",
		category: "Energy",
	},
  {
		id: 5,
		img: project_img_2,
		name: "Addressing Wind Energy",
		title: "ECO, Supply Chain",
		category: "Energy",
	},
  {
		id: 6,
		img: project_img_3,
		name: "Historical Book Design",
		title: "Finance, Supply",
		category: "Business",
	},

  {
		id: 2,
		img: project_img_2,
		name: "New Public Attitude Tracker",
		title: "Digital Product",
		category: "Finance",
	},
  {
		id: 3,
		img: project_img_3,
		name: "Smarter Ways to Manage",
		title: "ECO, Supply Chain",
		category: "Supply Chain",
	}, 



];
export default project_data;
