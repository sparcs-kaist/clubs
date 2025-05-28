# Clubs Interface 패키지

## Interface 패키지란?

Interface 패키지는 clubs의 백엔드와 프론트엔드과 같은 언어(typescript)를 사용한다는 점에서 착안하여, 두 애플리케이션이 서로간의 api에서 DTO(Data Transfer Object)를 공유하기 위해 선언된 패키지입니다.

## Interface 패키지에는 어떤 코드가 들어가나요?

1. clubs에 존재하는 모든 api에 대한 정의
2. api 선언에 이용되는 약간의 util 함수
3. clubs에 존재하는 일부 도메인에 대한 타입 정의

이중 3번은 domain 패키지가 생긴 만큼 domain 패키지로 이동해야 하는 내용입니다.

## Interface 패키지가 자동으로 swagger 문서를 생성하는 방법

Interface 패키지는 선언한 api에 추가한 openapi 정보를 바탕으로 swagger 문서를 생성하는 역할을 수행합니다. 자세한 코드는 index.ts 에서 확인할 수 있습니다. 이곳에서 생성한 문서를 바탕으로 doc 페이지를 서빙할 수 있습니다.

따라서 앞으로 새로이 추가되는 인터페이스에는 필수로 openapi를 선언하는 것을 권장드립니다!
