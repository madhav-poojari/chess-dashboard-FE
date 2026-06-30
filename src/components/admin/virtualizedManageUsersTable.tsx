import {
createColumnHelper,
} from "@tanstack/react-table";
import { User } from "../../api/user/dto";

const columnHelper = createColumnHelper<User>();
const columns = [
    columnHelper.accessor("first_name", {
        header: "Name",
        cell: info => {
            const user = info.row.original;

            return (
                <>
                    <div>
                        {user.first_name} {user.last_name}
                    </div>
                    <div>{user.id}</div>
                </>
            );
        },
    }),
    
];