from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class TableRow(BaseModel):
    id: int
    sno: int
    capacity: float
    group: str
    ppaMerchant: str
    type: str
    solar: Optional[float] = None
    wind: Optional[float] = None
    spv: str
    locationCode: str
    location: str
    pss: str
    connectivity: str
    # Allow extra fields just in case
    class Config:
        extra = "allow"

class TableDataRequest(BaseModel):
    fiscalYear: str
    data: List[TableRow]

class DropdownOptions(BaseModel):
    fiscalYear: Optional[str] = "FY_25"
    groups: List[str]
    ppaMerchants: List[str]
    types: List[str]
    locationCodes: List[str]
    locations: List[str]
    connectivities: List[str]
    # Allow extra fields for dynamic options
    class Config:
        extra = "allow"

class LocationRelationship(BaseModel):
    location: str
    locationCode: str

class RestoreBackupRequest(BaseModel):
    fiscalYear: str
    version: int

class User(BaseModel):
    username: str
    email: str
    password: str

class Variable(BaseModel):
    key: str
    value: Any
    user_id: Optional[str] = None
