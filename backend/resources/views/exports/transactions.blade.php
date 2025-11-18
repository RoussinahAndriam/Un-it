<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transactions {{ $year }}</title>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
        }
        th {
            background: #f4f4f4;
        }
    </style>
</head>
<body>
    <h2>Transactions pour l'année {{ $year }}</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transactions as $t)
                <tr>
                    <td>{{ $t->transaction_date }}</td>
                    <td>{{ $t->type }}</td>
                    <td>{{ $t->amount }}</td>
                    <td>{{ $t->description }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
