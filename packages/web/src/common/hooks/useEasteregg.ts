import { useEffect } from "react";

const useEasterEgg = () => {
  useEffect(() => {
    const easterEgg = `%c
                        -     
                       -=.    
                      -===    
                     =====.   
:                   -=====-   
+-                 -=======   
++=               =========-  
+++=.            -==========  
+++++:          ============- 
++++++-        ============== 
+++++++=      ===============:
++++++++=.  .================:
+++++++++= .===============-  
++++++++=. ===============.   
+++++++=..==============:     
++++++=..==============       
+++++= .=============.        
++++=..============:          
+++=..===========-            
++= .===========-.            
+=.:==========+++++++===--:::.  
= :=======+++++++++++++++===: 
 :====+++++++++++++++=====:   
.---====++++++++=======-.     
             :=======-.       
            :======-.         
           :=====:            
          -====:              
         -===:                
        -=-.                  
       =-                     
     .:.                      
%c찾으셨군요!
SPARCS의 여정에 함께하지 않으시겠어요?
https://sparcs.org/
https://apply.sparcs.org/ (리크루팅 기간에 접속 가능)
     `;
    console.log(
      easterEgg,
      "color:#eba12a; font-weight: bold; margin: auto", // 로고 스타일
      "", // 텍스트 스타일
    );
    console.log();
  }, []);
};

export default useEasterEgg;
