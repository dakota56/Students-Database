-- phpMyAdmin SQL Dump
-- version 3.5.2.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Oct 25, 2013 at 12:15 PM
-- Server version: 5.5.23
-- PHP Version: 5.3.9

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `students_dev`
--

--
-- Dumping data for table `country`
--

INSERT INTO `country` (`id`, `code`, `name`) VALUES
(1, 'PH', 'Philippines'),
(2, 'AD', 'Andorra'),
(3, 'AE', 'United Arab Emirates'),
(4, 'AF', 'Afghanistan'),
(5, 'AG', 'Antigua and Barbuda'),
(6, 'AL', 'Albania'),
(7, 'AM', 'Armenia'),
(8, 'AO', 'Angola'),
(9, 'AQ', 'Antarctica'),
(10, 'AR', 'Argentina'),
(11, 'AT', 'Austria'),
(12, 'AU', 'Australia'),
(13, 'AZ', 'Azerbaijan'),
(14, 'BA', 'Bosnia and Herzegovina'),
(15, 'BB', 'Barbados'),
(16, 'BD', 'Bangladesh'),
(17, 'BE', 'Belgium'),
(18, 'BF', 'Burkina Faso'),
(19, 'BG', 'Bulgaria'),
(20, 'BH', 'Bahrain'),
(21, 'BI', 'Burundi'),
(22, 'BJ', 'Benin'),
(23, 'BN', 'Brunei'),
(24, 'BO', 'Bolivia'),
(25, 'BR', 'Brazil'),
(26, 'BS', 'Bahamas'),
(27, 'BT', 'Bhutan'),
(28, 'BW', 'Botswana'),
(29, 'BY', 'Belarus'),
(30, 'BZ', 'Belize'),
(31, 'CA', 'Canada'),
(32, 'CD', 'Democratic Republic of the Congo'),
(33, 'CF', 'Central African Republic'),
(34, 'CG', 'Republic of Congo'),
(35, 'CH', 'Switzerland'),
(36, 'CI', 'Côte d''Ivoire'),
(37, 'CL', 'Chile'),
(38, 'CM', 'Cameroon'),
(39, 'CN', 'China'),
(40, 'CO', 'Colombia'),
(41, 'CR', 'Costa Rica'),
(42, 'CU', 'Cuba'),
(43, 'CV', 'Cape Verde'),
(44, 'CY', 'Cyprus'),
(45, 'CZ', 'Czech Republic'),
(46, 'DE', 'Germany'),
(47, 'DJ', 'Djibouti'),
(48, 'DK', 'Denmark'),
(49, 'DM', 'Dominica'),
(50, 'DO', 'Dominican Republic'),
(51, 'DZ', 'Algeria'),
(52, 'EC', 'Ecuador'),
(53, 'EE', 'Estonia'),
(54, 'EG', 'Egypt'),
(55, 'EH', 'Western Sahara'),
(56, 'ER', 'Eritrea'),
(57, 'ES', 'Spain'),
(58, 'ET', 'Ethiopia'),
(59, 'FI', 'Finland'),
(60, 'FJ', 'Fiji'),
(61, 'FM', 'Micronesia'),
(62, 'FR', 'France'),
(63, 'GA', 'Gabon'),
(64, 'GB', 'United Kingdom'),
(65, 'GD', 'Grenada'),
(66, 'GE', 'Georgia'),
(67, 'GH', 'Ghana'),
(68, 'GM', 'Gambia'),
(69, 'GN', 'Guinea'),
(70, 'GQ', 'Equatorial Guinea'),
(71, 'GR', 'Greece'),
(72, 'GT', 'Guatemala'),
(73, 'GW', 'Guinea-Bissau'),
(74, 'GY', 'Guyana'),
(75, 'HN', 'Honduras'),
(76, 'HR', 'Croatia'),
(77, 'HT', 'Haiti'),
(78, 'HU', 'Hungary'),
(79, 'ID', 'Indonesia'),
(80, 'IE', 'Ireland'),
(81, 'IL', 'Israel'),
(82, 'IN', 'India'),
(83, 'IQ', 'Iraq'),
(84, 'IR', 'Iran'),
(85, 'IS', 'Iceland'),
(86, 'IT', 'Italy'),
(87, 'JM', 'Jamaica'),
(88, 'JO', 'Jordan'),
(89, 'JP', 'Japan'),
(90, 'KE', 'Kenya'),
(91, 'KG', 'Kyrgyzstan'),
(92, 'KH', 'Cambodia'),
(93, 'KI', 'Kiribati'),
(94, 'KM', 'Comoros'),
(95, 'KN', 'Saint Kitts and Nevis'),
(96, 'KP', 'North Korea'),
(97, 'KR', 'South Korea'),
(98, 'KW', 'Kuwait'),
(99, 'KZ', 'Kazakhstan'),
(100, 'LA', 'Laos'),
(101, 'LB', 'Lebanon'),
(102, 'LC', 'Saint Lucia'),
(103, 'LI', 'Liechtenstein'),
(104, 'LK', 'Sri Lanka'),
(105, 'LR', 'Liberia'),
(106, 'LS', 'Lesotho'),
(107, 'LT', 'Lithuania'),
(108, 'LU', 'Luxembourg'),
(109, 'LV', 'Latvia'),
(110, 'LY', 'Libya'),
(111, 'MA', 'Morocco'),
(112, 'MC', 'Monaco'),
(113, 'MD', 'Moldova'),
(114, 'ME', 'Montenegro'),
(115, 'MG', 'Madagascar'),
(116, 'MH', 'Marshall Islands'),
(117, 'MK', 'Macedonia'),
(118, 'ML', 'Mali'),
(119, 'MM', 'Myanmar'),
(120, 'MN', 'Mongolia'),
(121, 'MR', 'Mauritania'),
(122, 'MT', 'Malta'),
(123, 'MU', 'Mauritius'),
(124, 'MV', 'Maldives'),
(125, 'MW', 'Malawi'),
(126, 'MX', 'Mexico'),
(127, 'MY', 'Malaysia'),
(128, 'MZ', 'Mozambique'),
(129, 'NA', 'Namibia'),
(130, 'NE', 'Niger'),
(131, 'NG', 'Nigeria'),
(132, 'NI', 'Nicaragua'),
(133, 'NL', 'Netherlands'),
(134, 'NO', 'Norway'),
(135, 'NP', 'Nepal'),
(136, 'NR', 'Nauru'),
(137, 'NZ', 'New Zealand'),
(138, 'OM', 'Oman'),
(139, 'PA', 'Panama'),
(140, 'PE', 'Peru'),
(141, 'PG', 'Papua New Guinea'),
(142, 'PK', 'Pakistan'),
(143, 'PL', 'Poland'),
(144, 'PS', 'Palestina'),
(145, 'PT', 'Portugal'),
(146, 'PY', 'Paraguay'),
(147, 'QA', 'Qatar'),
(148, 'RO', 'Romania'),
(149, 'RS', 'Serbia'),
(150, 'RU', 'Russia'),
(151, 'RW', 'Rwanda'),
(152, 'SA', 'Saudi Arabia'),
(153, 'SB', 'Solomon Islands'),
(154, 'SC', 'Seychelles'),
(155, 'SD', 'Sudan'),
(156, 'SE', 'Sweden'),
(157, 'SG', 'Singapore'),
(158, 'SI', 'Slovenia'),
(159, 'SK', 'Slovakia'),
(160, 'SL', 'Sierra Leone'),
(161, 'SM', 'San Marino'),
(162, 'SN', 'Senegal'),
(163, 'SO', 'Somalia'),
(164, 'SR', 'Suriname'),
(165, 'SS', 'South Sudan'),
(166, 'ST', 'Sao Tome and Principe'),
(167, 'SV', 'El Salvador'),
(168, 'SY', 'Syria'),
(169, 'SZ', 'Swaziland'),
(170, 'TD', 'Chad'),
(171, 'TG', 'Togo'),
(172, 'TH', 'Thailand'),
(173, 'TJ', 'Tajikistan'),
(174, 'TL', 'East Timor'),
(175, 'TM', 'Turkmenistan'),
(176, 'TN', 'Tunisia'),
(177, 'TO', 'Tonga'),
(178, 'TR', 'Turkey'),
(179, 'TT', 'Trinidad and Tobago'),
(180, 'TV', 'Tuvalu'),
(181, 'TW', 'Taiwan'),
(182, 'TZ', 'Tanzania'),
(183, 'UA', 'Ukraine'),
(184, 'UG', 'Uganda'),
(185, 'US', 'United States'),
(186, 'UY', 'Uruguay'),
(187, 'UZ', 'Uzbekistan'),
(188, 'VA', 'Vatican City'),
(189, 'VC', 'Saint Vincent and the Grenadines'),
(190, 'VE', 'Venezuela'),
(191, 'VN', 'Vietnam'),
(192, 'VU', 'Vanuatu'),
(193, 'WS', 'Samoa'),
(194, 'YE', 'Yemen'),
(195, 'ZA', 'South Africa'),
(196, 'ZM', 'Zambia'),
(197, 'ZW', 'Zimbabwe');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;