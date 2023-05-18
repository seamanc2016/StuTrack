# StuTrack

StuTrack is a student registry web application designed to manage student records and information for a fictitious educational institute. It provides an intuitive interface for admins to perform CRUD (Create, Read, Update, Delete) operations on student data.

![mongo-compass](/images/stutrack-usage.gif)

## Table of Contents
1. [Getting Started](#getting-started)
2. [Usage](#usage)
3. [Technologies Used](#technologies-used)

## Getting Started

#### Prerequisites
- npm
- Access to MongoDB

#### Installation
1. **Navigate to the directory in which you want to clone the repository and do so.**

```sh
$ cd <your-local-directory>
$ git clone https://github.com/seamanc2016/StuTrack
```

2. **Install the dependencies using [npm](https://www.npmjs.com/):**

```sh
$ cd StuTrack
$ npm install
```
3. **After the installation is done, you can start the app by running:**

```sh
$ nodemon studentserver.js
```

**The application is hosted on port 5678. To view it, visit http://localhost:5678/**


## Usage

For environment configuration, be sure to have the variables below:

```sh
MONGODB_URI="[Your MongoDB URI]"
MONGODB_DB_NAME="college"
MONGODB_COLL_NAME="students"
```

## Technologies Used
Here is a list of some of the core technologies used:
- Bootstrap v5.3.0
- Express: v4.18.2
- EJS: v3.1.9
- jQuery: v3.6.3
- Mongodb: v5.1.0


