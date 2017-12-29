## Anticipatory Thinking for Smart City Planning
The current application is a brainstorming tool that can be used by city planners in order to visualize and understand how a project's consequences align with the city's long term goals and future vision. The application is browser based and has been designed for desktops and notebooks (not mobile devices or smaller tablets). At present, the application is English only. In terms of design, the application leverages Node.js for server side programming and MySQL database for data storage. Its frontend employs Bootstrap for styling and JavaScript for client side scripting; it employes AJAX to load data into the application without having to do a full page refresh, thus enabling more dynamic interactions.

## Authors
1. Jeris Alan Jawahar (jjawaha@ncsu.edu)
2. Sushant Gupta (sagupta@ncsu.edu)
3. Christopher Kampe (cwkampe@ncsu.edu)

## Software Requirements
1. Node.js >= 6.9.4
2. npm >= 5.4.2
3. MySQL >= 5.7.17
4. Git 

The Node.js package dependencies can be found in the `package.json` file.

## How to compile/build/run the application
1. Ensure the MySQL database is setup and MySQl service is running in the system
1. Download or clone the source code/project from the git repository using  `git clone https://github.com/LAS-NCSU/AnticipatoryThinking.git` and navigate to the folder `AnticipatoryThinking`
2. Install nodejs package dependencies using the command `npm install`
3. Start the node server by running `node index.js`
4. Open a browser and navigate to the URL `localhost:8080`

Note: The application is already live and can be accessed from [here](https://las-thinking.oscar.ncsu.edu) directly.

## Setting up the MySQL database
1. Install MySQL in your local system.
2. Create a user with username and password as `root`.
3. Import the `new_schema.sql` file from `config\sql` folder.

Note: For setting up the database in production system, ensure the database name is changes to `think_db` in the SQL file and the username and the password are set accordingly in the configuration files.

## Configuration
The configuration files are placed in the config folder. When running locally, the `config.js` file can be used as such. When deploting to production server, the following properties needs to be changed as follows:
1. database - 'think_db'
2. host - 'las-postgres.oscar.priv'
3. username - To be set accordingly
4. password - To be set accordingly

## How to push changes to production
We currently use the forever node package to keep running the nodejs script running continuously. The following steps are the taken to push any changes to production.
1. Navigate to the `/home/jjawaha/copy/AnticipatoryThinking` directory in the remote system and issue a `git pull` command.
2. Identify the directories and files that have changed.
3. Stop the existing running application using the command `sudo forever stop 0`
4. If there are any database or schema updates, run the necessary commands to update the database schemas.
5. Once the database updates are done, copy all the changed files and directories to the `/home/jjawaha/AnticipatoryThinking` directory using the command `sudo cp -R /home/jjawaha/copy/AnticipatoryThinking/directory_name/ /home/jjawaha/AnticipatoryThinking/`
6. It is highly unlikely that the `config.js` will need to be updated so please ensure you do not modify it. If you need to update any files within the config directory make sure you copy the files individually.
7. Once all the files are updated, navigate to `/home/jjawaha/AnticipatoryThinking` directory and run the following command `sudo forever start -al forever.log -o output.log index.js`

## Instructions to use the application
The basic usage instructions for the application can be found [here](https://las-thinking.oscar.ncsu.edu/faq).
