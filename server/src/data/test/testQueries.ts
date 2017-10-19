export default `
  mutation createZetteli {
    createZetteli(z: {
          id: "4",
          body: "Zetteli 4444",
          tags: [
            "t44",
            "t23"
          ],
          datetime: "2017-09-18T09:53:11.443Z"
    })
  }
  
  query getZetteli {
    stack(id: "1"){
      zettelis {
        id
        datetime
        tags
        body
      }
    }
  }
  
  mutation deleteZetteli {
    deleteZetteli(id: "4")
  }
  
  mutation updateZetteli {
      updateZetteli(z: {
          id: "4",
          body: "Z4",
          tags: [
            "t444",
            "t234"
          ],
          datetime: "2017-09-18T10:14:11.444Z"
    })
  }

  mutation createStack {
    createStack(s: {
          id: "4",
          name: "Stack 4",
          public: true,
          createdAt: "2017-09-18T09:53:11.443Z",
          settings: { defaultTags: "t1 t2" }
    })
  }
  
  query getStack {
    stack(id: "1") {
      id
      name
      createdAt
      public
      settings
    }
  }
  
  mutation deleteStack {
    deleteStack(id: "4")
  }
  
  mutation updateStack {
      updateZetteli(z: {
          id: "4",
          name: "S4",
          public: false,
          createdAt: "2017-09-18T10:14:11.444Z",
          settings: { defaultTags: "tNEW" }
    })
  }
  `;
