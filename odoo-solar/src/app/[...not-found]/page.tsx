import Error from "@/components/Error";
import Wrapper from "@/layouts/Wrapper";
 
export const metadata = {
  title: '404 || error - SolerPanel-Solar & Renewable Energy React Next js Template',
  description: 'The Solar Panel React Next js template is a modern and responsive design specifically created for websites related to solar energy and renewable energy solutions',
}


const index = () => {
  return (
    <Wrapper>
      <Error />
    </Wrapper>
  );
};

export default index;