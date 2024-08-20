import Roles from "../models/roles.js";

export const createRole = async (req, res) => {
  try {
    const {name} = req.body;
    const role = await Roles.create({name});
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};
export const getAllRoles = async (req, res) => {
  try{
    const roles = await Roles.findAll();
    if(!roles){
      return res.status(404).json({error: 'Roles not found'});
    }
    res.status(200).json(roles);
  }catch (e) {
  
  }
}