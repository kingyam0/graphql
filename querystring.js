/*
query requests the id and login fields from the user object for a user with ID value 751
*/
const Query = `{
    userinfo: user(where: {login: {_eq: "Kingyam"}}) {
        login
        id
    }
    usersProgress: progress(where: {_and: [{user: {login: {_eq: "Kingyam"}}}, {object: {type: {_eq: "project"}}}, {isDone: {_eq: true}}, {grade: {_neq: 0}}]}
    order_by: {updatedAt: asc}
    ) {
    id 
    grade
    createdAt
    updatedAt
        object {
            id
            name
        }
    }
    userTransactions: transaction(where: {_and: [{user: {login: {_eq: "Kingyam"}}}, {object: {type: {_eq: "project"}}},  {type: {_eq: "xp"}}]}
      order_by: {amount: desc}
    ) {
        amount
    createdAt
        object {
          id
            name
        }
    }
}`;

export { Query }