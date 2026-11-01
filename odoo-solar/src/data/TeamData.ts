import team_avatar_1 from "@/assets/images/team/team1.png";
import team_avatar_2 from "@/assets/images/team/team2.png";
import team_avatar_3 from "@/assets/images/team/team3.png";
import team_avatar_4 from "@/assets/images/team/team4.png";
import { StaticImageData } from "next/image";


interface DataType {
  id: number;
  path: string;
  avatar: StaticImageData;
  name: string;
  designation: string;
}



const team_data:DataType[] = [
    {
      id: 1,
      path: "home_1",
      avatar: team_avatar_1,
      name: "Roten Barsaw",
      designation: "Chief Engineer",
    },
    {
      id: 2,
      path: "home_1",
      avatar: team_avatar_2,
      name: "David Miller",
      designation: "Chief Engineer",
    },
    {
      id: 3,
      path: "home_1",
      avatar: team_avatar_3,
      name: "Steven Smith",
      designation: "Chief Engineer",
    },
    {
      id: 4,
      path: "home_1",
      avatar: team_avatar_4,
      name: "Jasson Roy",
      designation: "Chief Engineer",
    },
    // team page 
    {
      id: 5,
      path: "team",
      avatar: team_avatar_2,
      name: "Roten Barsaw",
      designation: "Chief Engineer",
    },
    {
      id: 6,
      path: "team",
      avatar: team_avatar_1,
      name: "David Miller",
      designation: "Chief Engineer",
    },
    {
      id: 7,
      path: "team",
      avatar: team_avatar_4,
      name: "Steven Smith",
      designation: "Chief Engineer",
    },
    {
      id: 8,
      path: "team",
      avatar: team_avatar_3,
      name: "Jasson Roy",
      designation: "Chief Engineer",
    }
]

export default team_data